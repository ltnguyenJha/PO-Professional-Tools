# PO Professional Tools — Troubleshooting Guide

## Common Issues & Solutions

### Extension Not Loading

**Symptom:** Extension doesn't appear in VS Code or commands not found

**Solutions:**
1. Check the error logs: View → Output → "PO Professional Tools"
2. Verify extension is enabled: Extensions → "PO Professional Tools" → Enable
3. Reload VS Code: Ctrl+Shift+P → Developer: Reload Window
4. Clear extension storage: Delete `~/.vscode/extensions/po-professional-tools-*/`

### Build Failures

**Symptom:** `npm run build` fails with error

**Solutions:**
1. Clear build artifacts: `rm -rf dist/` (Windows: `rmdir /s dist`)
2. Clean node_modules: `npm clean-install`
3. Also clean webview dependencies:
   ```bash
   cd webview-ui && npm clean-install && cd ..
   ```
4. Check TypeScript errors: Look for errors in output
5. Verify all dependencies are installed: `npm install`

### Webview Not Rendering

**Symptom:** Panel opens but shows blank or error message

**Solutions:**
1. Check VS Code Output → "PO Professional Tools" for errors
2. Open Developer Tools: Ctrl+Shift+I in the Development Host
3. Check browser console for React errors
4. Verify IPC communication: 
   - Extension should emit 'ready' message
   - Webview should receive and handle it
5. Hard reload webview: Ctrl+Shift+P → Reload Window

### High CPU Usage or Performance Issues

**Symptom:** VS Code becomes slow or unresponsive

**Solutions:**
1. Check for infinite loops in event handlers
2. Use React DevTools Profiler to identify slow components
3. Limit IPC message frequency (batch updates)
4. Check file system operations aren't blocking

**Prevention:**
- Use `debounce()` or `throttle()` for frequent events
- Implement proper cleanup in React hooks (`useEffect` cleanup)
- Monitor long-running operations

### "Extension Host Crashed"

**Symptom:** Extension Host process crashes unexpectedly

**Solutions:**
1. Check for uncaught exceptions in extension code
2. Ensure all promises are properly handled (no unhandled rejections)
3. Add try-catch blocks around external API calls
4. Check OS-level logs for more details

**Example Fix:**
```typescript
// Bad - unhandled promise rejection
myAsyncFunction();

// Good - properly handled
myAsyncFunction().catch(error => {
  console.error('Error:', error);
  vscode.window.showErrorMessage('Operation failed');
});
```

### Configuration Not Persisting

**Symptom:** Settings changed in UI don't persist after reload

**Solutions:**
1. Verify settings are written to correct location:
   ```typescript
   const config = vscode.workspace.getConfiguration('poTools');
   await config.update('setting', value, vscode.ConfigurationTarget.Global);
   ```
2. Check for permission errors in VS Code output
3. Verify user has write permissions to settings location
4. Try workspace-level settings instead:
   ```typescript
   await config.update('setting', value, vscode.ConfigurationTarget.Workspace);
   ```

### IPC Communication Not Working

**Symptom:** Messages between extension and webview not being received

**Solutions:**
1. Verify panel exists and is visible:
   ```typescript
   if (!panel || !panel.visible) {
     console.warn('Panel not available');
   }
   ```
2. Check message format is correct:
   ```typescript
   // Must be plain object, not class instance
   panel.webview.postMessage({
     command: 'myCommand',
     data: { /* plain data only */ }
   });
   ```
3. Use console logging to trace message flow:
   ```typescript
   console.log('Extension received:', event.data);
   ```
4. Verify CSP policy allows message passing (check `.vscodeignore`)

### Memory Leaks

**Symptom:** Memory usage grows over time until VS Code becomes unresponsive

**Solutions:**
1. Ensure event listeners are unregistered:
   ```typescript
   const subscription = vscode.workspace.onDidChangeConfiguration(() => {});
   context.subscriptions.push(subscription); // Auto-dispose on deactivate
   ```
2. Clean up React effects:
   ```typescript
   useEffect(() => {
     // setup
     return () => {
       // cleanup
     };
   }, []);
   ```
3. Dispose webview resources on close:
   ```typescript
   panel.onDidDispose(() => {
     // cleanup resources
   });
   ```

### "Cannot find module" or TypeScript Errors

**Symptom:** Build fails with module resolution errors

**Solutions:**
1. Check file exists and path is correct (case-sensitive on Linux/Mac)
2. Verify tsconfig.json has correct paths:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```
3. Install missing dependencies: `npm install`
4. Rebuild: `npm run build`

### "Content Security Policy" Violations

**Symptom:** Webview shows warning about CSP violations or content doesn't load

**Solutions:**
1. Add resource to CSP whitelist in webview configuration:
   ```typescript
   webview.options = {
     enableScripts: true,
     localResourceRoots: [
       vscode.Uri.file(path.join(context.extensionPath, 'media'))
     ]
   };
   ```
2. Use `nonce` attribute for inline scripts
3. Check `.vscodeignore` isn't blocking needed resources

## Getting Help

1. **Check logs:** View → Output → "PO Professional Tools"
2. **Enable debug mode:** Add debug logging in code
3. **Check GitHub Issues:** https://github.com/ltnguyenJha/PO-Professional-Tools/issues
4. **VS Code Help:** https://code.visualstudio.com/docs

---

**Last Updated:** 2026-04-28
