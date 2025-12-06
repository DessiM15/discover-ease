# Troubleshooting Connection Issues

## Server Status
Your Next.js server should be running on **http://localhost:3000**

## Quick Checks

1. **Verify server is running:**
   ```bash
   cd discoverease
   npm run dev
   ```
   
   You should see:
   ```
   ▲ Next.js 16.0.7 (Turbopack)
   - Local:        http://localhost:3000
   ```

2. **Test server directly:**
   ```bash
   curl http://localhost:3000
   ```
   
   If this works but your browser doesn't, it's a browser issue.

## Common Issues & Solutions

### Issue: "Site can't be reached" in browser
**Solution:**
- Make sure you're using `http://localhost:3000` (not https)
- Try `127.0.0.1:3000` instead
- Check if another app is using port 3000
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Connection refused
**Solution:**
- Verify the dev server is actually running
- Check for port conflicts:
  ```bash
  lsof -i :3000
  ```
- Kill any processes using the port:
  ```bash
  kill -9 $(lsof -ti:3000)
  ```
- Restart the dev server

### Issue: Page loads but shows errors
**Solution:**
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for failed requests
- Look for Supabase connection errors (may need environment variables)

## Restart Server

If nothing works, restart everything:

```bash
# Stop any running servers
pkill -f "next dev"

# Clear build cache
cd discoverease
rm -rf .next

# Start fresh
npm run dev
```

## Environment Variables

Make sure you have a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Still Having Issues?

Check the terminal where `npm run dev` is running for error messages.


