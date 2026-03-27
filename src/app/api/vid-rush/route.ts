import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Path to the Python engine
    const enginePath = path.join(process.cwd(), '..', '..', '..', 'maven_crew', 'vid_rush_engine.py');
    const pythonCmd = `python "${enginePath}" "${topic}"`;

    console.log(`[API] Executing: ${pythonCmd}`);

    // Execute the Python script asynchronously
    // In a real app, you might want to use a job queue (BullMQ, etc.)
    exec(pythonCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`[ENGINE ERROR] ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[ENGINE STDERR] ${stderr}`);
        return;
      }
      console.log(`[ENGINE STDOUT] ${stdout}`);
    });

    return NextResponse.json({ message: 'Synthesis initiated', topic });
  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
