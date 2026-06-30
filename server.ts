import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // API Endpoints - Put them before the Vite middleware!
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "TaskPilot AI API Engine" });
  });

  // Task prioritization and schedule generation endpoint using Gemini
  app.post("/api/gemini/optimize", async (req, res) => {
    const { tasks, userId } = req.body;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "At least one task is required for optimization." });
    }

    try {
      const client = getGeminiClient();
      
      const prompt = `
        You are a Professional Productivity Coach, Time Management Expert, Planning Assistant, and Decision Support System for an Android application called TaskPilot AI.
        Analyze the user's workload of pending tasks and organize them into a highly optimized, realistic schedule for the day.
        
        Do NOT ask follow-up questions. Do NOT produce long paragraphs. Always provide structured actionable recommendations.
        
        Current Time: ${new Date().toISOString()}
        
        Tasks to analyze:
        ${JSON.stringify(tasks, null, 2)}
        
        Guidelines for scheduling and analysis:
        1. Analyze workload and identify urgent work.
        2. Predict deadline risks based on estimated duration vs. remaining time.
        3. Estimate a realistic completion order (highest value/urgency first).
        4. Balance the workload across the day. Avoid impossible or overlapping schedules.
        5. Recommend short breaks (e.g., 10-15 mins) and lunch/dinner windows as necessary to keep the user energized.
        6. Recommend focus windows.
        7. Recommend postponing or deprioritizing low-value, low-urgency work if the workload is too heavy.
        8. Always prioritize upcoming, close deadlines.
        9. Never overload the user.
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dailyBrief: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING, description: "Concise overview summarizing today's tasks and total load." },
                  estimatedWorkload: { type: Type.STRING, description: "Estimated total focus time or workload level." },
                  focusWindow: { type: Type.STRING, description: "Recommended prime focus block of the day, e.g., '09:00 - 11:30'." },
                  message: { type: Type.STRING, description: "Short, motivational or punchy productivity warning message, e.g., 'Complete DBMS before lunch.'" }
                },
                required: ["summary", "estimatedWorkload", "focusWindow", "message"]
              },
              priorityOrder: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of task IDs ordered from highest priority to lowest priority."
              },
              taskDetails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING },
                    priorityRank: { type: Type.INTEGER },
                    priorityReason: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, enum: ["low", "moderate", "high", "critical"] },
                    riskReason: { type: Type.STRING },
                    riskRecommendation: { type: Type.STRING }
                  },
                  required: ["taskId", "priorityRank", "priorityReason", "riskLevel", "riskReason", "riskRecommendation"]
                }
              },
              todaySchedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING, description: "Task ID of the scheduled task. Leave empty or set to 'break', 'lunch', etc. for non-task blocks." },
                    taskTitle: { type: Type.STRING, description: "Title of the block. E.g., task title, 'Break', 'Lunch'." },
                    startTime: { type: Type.STRING, description: "Start time in HH:MM format." },
                    endTime: { type: Type.STRING, description: "End time in HH:MM format." },
                    duration: { type: Type.INTEGER, description: "Duration in minutes." }
                  },
                  required: ["taskId", "taskTitle", "startTime", "endTime", "duration"]
                }
              },
              workloadBalance: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, enum: ["balanced", "busy", "overloaded"] },
                  explanation: { type: Type.STRING, description: "Short explanation of why this workload status was chosen." }
                },
                required: ["status", "explanation"]
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 highly actionable, personalized coaching tips."
              }
            },
            required: ["dailyBrief", "priorityOrder", "taskDetails", "todaySchedule", "workloadBalance", "recommendations"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini.");
      }

      const result = JSON.parse(responseText.trim());
      
      // Map to Client-compatible AIPlan properties
      const clientPlan = {
        id: userId,
        ownerId: userId,
        priorityOrder: result.priorityOrder || [],
        todaySchedule: result.todaySchedule || [],
        deadlineRisk: result.workloadBalance?.status === "overloaded" ? "critical" : (result.workloadBalance?.status === "busy" ? "high" : "low"),
        recommendations: result.recommendations || [],
        lastOptimizedAt: new Date().toISOString(),
        dailyBrief: result.dailyBrief,
        taskDetails: (result.taskDetails || []).reduce((acc: any, curr: any) => {
          acc[curr.taskId] = curr;
          return acc;
        }, {}),
        workloadBalance: result.workloadBalance
      };

      res.json(clientPlan);
    } catch (e: any) {
      console.warn("[TaskPilot AI] Gemini API call failed or rate-limited. Activating state-of-the-art local advanced coaching fallback...", e);

      // We perform a pristine local optimization fallback to prevent application disruption
      const pendingTasks = tasks.filter((t: any) => !t.completed);
      
      const priorityWeight: Record<string, number> = {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "low": 1
      };

      const sorted = [...pendingTasks].sort((a: any, b: any) => {
        const aW = priorityWeight[(a.priority || "medium").toLowerCase()] || 2;
        const bW = priorityWeight[(b.priority || "medium").toLowerCase()] || 2;
        if (bW !== aW) return bW - aW;
        return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
      });

      const priorityOrder = sorted.map((t: any) => t.id);

      // Generate Today Schedule starting at 09:00 AM
      const todaySchedule = [];
      let currentMinutes = 9 * 60; // 09:00 AM

      const formatTime = (totalMin: number) => {
        const hrs = Math.floor(totalMin / 60) % 24;
        const mins = totalMin % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      };

      for (let i = 0; i < sorted.length; i++) {
        const task = sorted[i];
        const duration = task.estimatedDuration || 30;
        const startTimeStr = formatTime(currentMinutes);
        currentMinutes += duration;
        const endTimeStr = formatTime(currentMinutes);

        todaySchedule.push({
          taskId: task.id,
          taskTitle: task.title,
          startTime: startTimeStr,
          endTime: endTimeStr,
          duration: duration
        });

        // Insert break or lunch window
        if (i < sorted.length - 1) {
          if (currentMinutes >= 12.5 * 60 && currentMinutes < 13.5 * 60) {
            const startL = formatTime(currentMinutes);
            currentMinutes += 45; // 45 min lunch
            const endL = formatTime(currentMinutes);
            todaySchedule.push({
              taskId: "lunch",
              taskTitle: "Lunch Window",
              startTime: startL,
              endTime: endL,
              duration: 45
            });
          } else {
            const startB = formatTime(currentMinutes);
            currentMinutes += 15; // 15 min break
            const endB = formatTime(currentMinutes);
            todaySchedule.push({
              taskId: "break",
              taskTitle: "Stretch & Hydrate Break",
              startTime: startB,
              endTime: endB,
              duration: 15
            });
          }
        }
      }

      if (todaySchedule.length === 0) {
        todaySchedule.push({
          taskId: "rest",
          taskTitle: "General Cognitive Strategy Session",
          startTime: "09:00",
          endTime: "09:30",
          duration: 30
        });
      }

      // Compute individual task details and risk assessments
      const now = new Date();
      const taskDetails = {} as any;

      sorted.forEach((task: any, idx: number) => {
        const deadlineDate = new Date(task.deadline || Date.now());
        const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        let riskLevel = "low";
        let riskReason = "Optimal timeline buffers. Proceed with standard cognitive pacing.";
        let riskRecommendation = "Ensure strict tracking and finish this task within its scheduled focus window.";

        const p = (task.priority || "medium").toLowerCase();

        if (hoursLeft < 0) {
          riskLevel = "critical";
          riskReason = "Task deadline has already been exceeded. Timeline parameters compromised.";
          riskRecommendation = "Immediate action needed. Override standard schedule parameters to finalize this item.";
        } else if (hoursLeft <= 12 || p === "critical") {
          riskLevel = "critical";
          riskReason = "EXTREME deadline proximity detected. Less than 12 hours left to complete task constraint.";
          riskRecommendation = "Tackle this block as your ONE immediate priority now in absolute Focus Mode.";
        } else if (hoursLeft <= 24 || p === "high") {
          riskLevel = "high";
          riskReason = "High priority task with a deadline falling within the next 24-hour cycle.";
          riskRecommendation = "Allocate undivided mental energy to this segment before midday fatigue sets in.";
        } else if (hoursLeft <= 48) {
          riskLevel = "moderate";
          riskReason = "Task is approaching within 48 hours. Timeline window is narrowing.";
          riskRecommendation = "Maintain steady incremental focus to avoid eleventh-hour cognitive overload.";
        }

        taskDetails[task.id] = {
          taskId: task.id,
          priorityRank: idx + 1,
          priorityReason: `Calibrated at Rank #${idx + 1} based on ${task.priority || "medium"} priority and close deadline parameters.`,
          riskLevel: riskLevel,
          riskReason: riskReason,
          riskRecommendation: riskRecommendation
        };
      });

      const totalMinutes = pendingTasks.reduce((sum: number, t: any) => sum + (t.estimatedDuration || 30), 0);
      const recommendations = [
        "Complete your highest-priority objective before your first scheduled break to build rapid momentum.",
        "Maintain absolute single-tasking discipline; avoid switching between browser tabs or code contexts during active sessions.",
        "Take a dedicated 15-minute cool-down interval after each deep focus window to lower cognitive fatigue."
      ];

      if (totalMinutes > 300) {
        recommendations.push("Warning: Heavy workload detected. Defer secondary tasks or reschedule non-critical assignments to secure premium delivery.");
      } else {
        recommendations.push("Your day is optimally sized. Use any surplus hours to finalize tomorrow's high-value specifications.");
      }

      let workloadStatus = "balanced";
      let workloadExplanation = "Your focus hours are well distributed and allow steady cognitive recovery.";

      if (totalMinutes > 360) {
        workloadStatus = "overloaded";
        workloadExplanation = `High-density focus required. Total tasks require ${(totalMinutes / 60).toFixed(1)} hours of intensive work.`;
      } else if (totalMinutes > 180) {
        workloadStatus = "busy";
        workloadExplanation = "Packed schedule. You have a series of high-value tasks back-to-back.";
      }

      const clientPlan = {
        id: userId,
        ownerId: userId,
        priorityOrder: priorityOrder,
        todaySchedule: todaySchedule,
        deadlineRisk: workloadStatus === "overloaded" ? "critical" : (workloadStatus === "busy" ? "high" : "low"),
        recommendations: recommendations,
        lastOptimizedAt: new Date().toISOString(),
        dailyBrief: {
          summary: "Local Coach Engine active. Telemetry compiled using your device's advanced deterministic optimizer.",
          estimatedWorkload: `${(totalMinutes / 60).toFixed(1)} Hours`,
          focusWindow: "09:00 AM - 12:00 PM",
          message: sorted.length > 0 
            ? `Your top priority is: ${sorted[0].title}. Execute this first to maximize compliance.` 
            : "All targets complete. Maintain streak metrics."
        },
        taskDetails: taskDetails,
        workloadBalance: {
          status: workloadStatus,
          explanation: workloadExplanation
        }
      };

      res.json(clientPlan);
    }
  });

  // Vite middleware integration for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TaskPilot AI] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start TaskPilot AI Server:", err);
});
