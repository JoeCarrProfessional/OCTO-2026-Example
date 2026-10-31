import { useEffect, useState } from 'react';
import { Button, Collapse } from '@mui/material';
import { getLogs, subscribeLogs } from '../lib/log.js';

// Shows the in-app log so you (or your AI assistant) can see what the data
// loader did without opening devtools.
export default function DebugLog() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(() => [...getLogs()]);

  useEffect(() => subscribeLogs((all) => setLogs([...all])), []);

  return (
    <section>
      <Button variant="text" size="small" onClick={() => setOpen((o) => !o)} id="toggle-debug">
        {open ? 'Hide' : 'Show'} debug log ({logs.length})
      </Button>
      <Collapse in={open}>
        <pre className="debug-log" id="debug-console">
          {logs.join('\n')}
        </pre>
      </Collapse>
    </section>
  );
}
