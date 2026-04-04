import 'dotenv/config';
import express from 'express'

import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import { protect } from './middlewares/authMiddleware.js';
import workspaceRouter from './routes/workspaceRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import taskRouter from './routes/taskRoutes.js';

const app = express();

//app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/',(req,res)=>res.send('Server is live!'))

app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces",protect, workspaceRouter)
app.use("/api/projects", protect, projectRouter)
app.use("/api/tasks", protect, taskRouter)

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`))