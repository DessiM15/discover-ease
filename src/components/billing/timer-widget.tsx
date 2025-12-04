"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, Square, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  onStop?: (hours: number, description: string, caseId: string) => void;
}

export function TimerWidget({ onStop }: TimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [description, setDescription] = useState("");
  const [caseId, setCaseId] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!caseId) {
      alert("Please select a case");
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    const hours = seconds / 3600;
    if (onStop && hours > 0) {
      onStop(hours, description, caseId);
    }
    setSeconds(0);
    setDescription("");
  };

  const activityCodes = [
    "Research",
    "Drafting",
    "Review",
    "Court",
    "Meeting",
    "Travel",
    "Admin",
  ];

  return (
    <Card className="sticky top-4 z-10 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-amber-500 mb-2">
                  {formatTime(seconds)}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant={isRunning ? "destructive" : "default"}
                    size="sm"
                    onClick={isRunning ? handlePause : handleStart}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleStop} disabled={seconds === 0}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Case</Label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Smith v. Johnson</SelectItem>
                    <SelectItem value="2">Estate of Williams</SelectItem>
                    <SelectItem value="3">State v. Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Activity Code</Label>
                <Select>
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityCodes.map((code) => (
                      <SelectItem key={code} value={code.toLowerCase()}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="mt-1 bg-slate-900/50 border-slate-800"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

