import * as azdev from 'azure-devops-node-api';
import { JsonPatchOperation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { TestSuiteType } from 'azure-devops-node-api/interfaces/TestPlanInterfaces';
import { AdoSettings } from '../shared/messages';

export interface TestCaseStep {
  action: string;
  expectedResult: string;
}

export interface GeneratedTestCase {
  title: string;
  steps: TestCaseStep[];
}

/**
 * Handles creation and management of ADO Test Plans, Test Suites, and Test Cases
 * for newly pushed or updated PBIs.
 */
export class TestPlanService {
  // ─── Connection ──────────────────────────────────────────────────────────────

  private createConnection(settings: AdoSettings, pat: string): azdev.WebApi {
    const authHandler = azdev.getPersonalAccessTokenHandler(pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    return new azdev.WebApi(orgUrl, authHandler);
  }

  private normalizeOrgUrl(orgUrl: string): string {
    return orgUrl.endsWith('/') ? orgUrl.slice(0, -1) : orgUrl;
  }

  // ─── Test Plan Name ───────────────────────────────────────────────────────────

  /**
   * Builds a test plan name in the format "[TeamName] [Month] [Year]"
   * e.g. "Umbrella Corp April 2026"
   *
   * Extracts month/year from the iteration path segment (e.g. "UC April26").
   * Falls back to current month/year if parsing fails.
   */
  public buildTestPlanName(team: string, iterationPath: string): string {
    const teamName = (team ?? '').trim() || 'Team';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthPattern = monthNames.join('|');
    const regex = new RegExp(`(${monthPattern})\\s*(\\d{2,4})`, 'i');
    const match = iterationPath.match(regex);

    if (match) {
      const month = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      const rawYear = match[2];
      const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
      return `${teamName} ${month} ${year}`;
    }

    // Fallback to current month/year
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear().toString();
    return `${teamName} ${month} ${year}`;
  }

  // ─── Test Plan ────────────────────────────────────────────────────────────────

  /**
   * Finds an existing test plan by exact name, or creates one if not found.
   * Returns the plan ID and root suite ID (needed to create child suites).
   */
  public async getOrCreateTestPlan(
    settings: AdoSettings,
    pat: string,
    planName: string,
    iterationPath: string
  ): Promise<{ planId: number; rootSuiteId: number }> {
    const connection = this.createConnection(settings, pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    const testPlanApi = await connection.getTestPlanApi(orgUrl);

    // Paginate through all plans to find a match by name
    let continuationToken: string | undefined;
    do {
      const page = await testPlanApi.getTestPlans(
        settings.projectName,
        undefined,
        continuationToken,
        true
      );
      const match = (page ?? []).find((p) => p.name === planName);
      if (match) {
        return { planId: match.id, rootSuiteId: match.rootSuite.id };
      }
      continuationToken = (page as unknown as { continuationToken?: string }).continuationToken;
    } while (continuationToken);

    // Not found — create a new one
    const newPlan = await testPlanApi.createTestPlan(
      { name: planName, iteration: iterationPath },
      settings.projectName
    );
    return { planId: newPlan.id, rootSuiteId: newPlan.rootSuite.id };
  }

  // ─── Test Suite ───────────────────────────────────────────────────────────────

  /**
   * Creates a static test suite under the root suite of a test plan.
   * Name format: "[PBI#] - [PBI title]"
   */
  public async createTestSuite(
    settings: AdoSettings,
    pat: string,
    planId: number,
    rootSuiteId: number,
    suiteName: string
  ): Promise<number> {
    const connection = this.createConnection(settings, pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    const testPlanApi = await connection.getTestPlanApi(orgUrl);

    const suite = await testPlanApi.createTestSuite(
      {
        name: suiteName,
        suiteType: TestSuiteType.StaticTestSuite,
        parentSuite: { id: rootSuiteId, name: '' }
      },
      settings.projectName,
      planId
    );
    return suite.id;
  }

  // ─── Test Case Work Items ─────────────────────────────────────────────────────

  /**
   * Creates ADO "Test Case" work items with detailed steps (Action + Expected Result).
   * Each test case is linked back to the PBI via a "Tested By" relation.
   * Returns the list of created work item IDs.
   */
  public async createTestCaseWorkItems(
    settings: AdoSettings,
    pat: string,
    testCases: GeneratedTestCase[],
    pbiWorkItemId: number
  ): Promise<number[]> {
    const connection = this.createConnection(settings, pat);
    const witApi = await connection.getWorkItemTrackingApi();
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    const pbiUrl = `${orgUrl}/${settings.projectName}/_apis/wit/workItems/${pbiWorkItemId}`;

    const createdIds: number[] = [];

    for (const tc of testCases) {
      const stepsXml = this.buildTestStepsXml(tc.steps);
      const patch: JsonPatchOperation[] = [
        { op: 'add', path: '/fields/System.Title', value: tc.title } as JsonPatchOperation,
        { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: stepsXml } as JsonPatchOperation,
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'Microsoft.VSTS.Common.TestedBy-Reverse',
            url: pbiUrl,
            attributes: { comment: 'Auto-generated by PO Tools' }
          }
        } as JsonPatchOperation
      ];

      const workItem = await witApi.createWorkItem(
        undefined,
        patch,
        settings.projectName,
        'Test Case'
      );
      if (workItem?.id) {
        createdIds.push(workItem.id);
      }
    }

    return createdIds;
  }

  // ─── Add to Suite ─────────────────────────────────────────────────────────────

  /**
   * Links existing test case work items into a test suite.
   */
  public async addTestCasesToSuite(
    settings: AdoSettings,
    pat: string,
    planId: number,
    suiteId: number,
    testCaseIds: number[]
  ): Promise<void> {
    if (testCaseIds.length === 0) {
      return;
    }
    const connection = this.createConnection(settings, pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    const testPlanApi = await connection.getTestPlanApi(orgUrl);

    const params = testCaseIds.map((id) => ({ workItem: { id } }));
    await testPlanApi.addTestCasesToSuite(params, settings.projectName, planId, suiteId);
  }

  // ─── Existing Test Cases ──────────────────────────────────────────────────────

  /**
   * Finds a test suite in the given plan whose name starts with the PBI work item ID prefix
   * (e.g. "522284 - "). Returns the suite ID, or undefined if not found.
   * Stable match: uses PBI ID (never changes) rather than full title (can change).
   */
  public async findTestSuiteByPbiId(
    settings: AdoSettings,
    pat: string,
    planId: number,
    pbiWorkItemId: number
  ): Promise<number | undefined> {
    const connection = this.createConnection(settings, pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    const testPlanApi = await connection.getTestPlanApi(orgUrl);

    const prefix = `${pbiWorkItemId} - `;
    let continuationToken: string | undefined;
    do {
      const page = await testPlanApi.getTestSuitesForPlan(
        settings.projectName,
        planId,
        undefined,
        continuationToken
      );
      const match = (page ?? []).find((s) => s.name?.startsWith(prefix));
      if (match) {
        return match.id;
      }
      continuationToken = (page as unknown as { continuationToken?: string }).continuationToken;
    } while (continuationToken);

    return undefined;
  }

  /**
   * Returns the titles of all test cases currently in a suite (used to skip duplicates on update).
   */
  public async getExistingTestCaseTitles(
    settings: AdoSettings,
    pat: string,
    planId: number,
    suiteId: number
  ): Promise<string[]> {
    const connection = this.createConnection(settings, pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    const testPlanApi = await connection.getTestPlanApi(orgUrl);

    const page = await testPlanApi.getTestCaseList(
      settings.projectName,
      planId,
      suiteId
    );

    return (page ?? [])
      .map((tc) => tc.workItem?.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Encodes test steps into the XML format expected by ADO's
   * Microsoft.VSTS.TCM.Steps work item field.
   */
  private buildTestStepsXml(steps: TestCaseStep[]): string {
    const stepElements = steps
      .map((step, index) => {
        const action = this.escapeXml(step.action);
        const expected = this.escapeXml(step.expectedResult);
        return [
          `<step id="${index + 1}" type="ValidateStep">`,
          `<parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;${action}&lt;/P&gt;&lt;/DIV&gt;</parameterizedString>`,
          `<parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;${expected}&lt;/P&gt;&lt;/DIV&gt;</parameterizedString>`,
          '<description/>',
          '</step>'
        ].join('');
      })
      .join('');

    return `<steps id="0" last="${steps.length}">${stepElements}</steps>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
