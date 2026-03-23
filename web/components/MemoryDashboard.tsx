import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function MemoryDashboard() {
  const [memoryCount, setMemoryCount] = useState(0);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Memory Dashboard</CardTitle>
        <CardDescription>Manage your LLM agent's memory system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Memories</span>
            <span className="text-2xl font-bold">{memoryCount}</span>
          </div>
          <Button onClick={() => setMemoryCount((c) => c + 1)} className="w-full">
            Add Memory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
