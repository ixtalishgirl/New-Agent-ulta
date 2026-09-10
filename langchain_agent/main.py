"""
FastAPI Server for Halye LangChain Agentic Brain & Admin Interface.
Exposes full raw administrative API endpoints for autonomous tool execution,
AgentExecutor invocations, memory inspection, and real-time telemetry.
"""

import os
import sys
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure package paths
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.getcwd())

from langchain_agent.agent import agent_brain

app = FastAPI(
    title="Halye LangChain Agentic Brain API",
    description="Autonomous Tool-Calling Engine with AgentExecutor, ConversationBufferMemory, and Full Raw Access",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_API_KEY = os.environ.get("HALYE_ADMIN_KEY", "sk-halye-raw-access-admin")

# Request Models
class RunAgentRequest(BaseModel):
    prompt: str = Field(..., description="Prompt or directive for the autonomous agent")
    framework: Optional[str] = Field("tool_calling", description="Agent framework: 'tool_calling' or 'react'")

class ExecuteToolRequest(BaseModel):
    tool_name: str = Field(..., description="Tool name: web_search, file_system_reader, api_execution_tool, terminal_command_executor")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Dictionary of arguments for the tool")


def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    """Optional admin validation for protected raw endpoints; allows open dev access if not set."""
    if x_admin_key and x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid X-Admin-Key token")
    return True


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Halye LangChain Agentic Brain",
        "version": "2.0.0",
        "model_engine": agent_brain.model_type,
        "tools_count": len(agent_brain.tools),
        "tools": [t.name for t in agent_brain.tools],
        "endpoints": {
            "run": "/api/agent/run",
            "tools": "/api/agent/tools",
            "execute_tool": "/api/agent/tools/execute",
            "memory": "/api/agent/memory",
            "clear_memory": "/api/agent/memory/clear",
            "history": "/api/agent/history",
            "admin_info": "/api/admin/info",
            "docs": "/docs"
        },
        "admin_auth": "Provide 'X-Admin-Key: sk-halye-raw-access-admin' header or bearer token"
    }


@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": time.time()}


@app.post("/api/agent/run")
def run_agent(req: RunAgentRequest):
    """
    Execute an instruction through the AgentExecutor.
    Maintains memory across calls and returns complete intermediate steps and thought logs.
    """
    try:
        res = agent_brain.run(req.prompt, framework=req.framework)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agent/tools")
def list_tools():
    """Returns manifest of all available tools with docstrings and argument schemas."""
    manifest = agent_brain.get_tools_manifest()
    return {
        "success": True,
        "count": len(manifest),
        "tools": manifest
    }


@app.post("/api/agent/tools/execute")
def execute_tool(req: ExecuteToolRequest):
    """Directly executes a tool in the arsenal without going through the LLM."""
    tool_map = {t.name: t for t in agent_brain.tools}
    if req.tool_name not in tool_map:
        raise HTTPException(status_code=404, detail=f"Tool '{req.tool_name}' not found. Available: {list(tool_map.keys())}")
    
    t = tool_map[req.tool_name]
    try:
        output = t.invoke(req.arguments)
        return {
            "success": True,
            "tool": req.tool_name,
            "arguments": req.arguments,
            "result": output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")


@app.get("/api/agent/memory")
def get_memory():
    """Returns the current ConversationBufferMemory state."""
    messages = agent_brain.get_memory_state()
    return {
        "success": True,
        "turns_count": len(messages),
        "messages": messages
    }


@app.post("/api/agent/memory/clear")
def clear_memory():
    """Resets and flushes the ConversationBufferMemory."""
    result = agent_brain.clear_memory()
    return result


@app.get("/api/agent/history")
def get_history():
    """Returns recent AgentExecutor execution logs with all thoughts and intermediate steps."""
    return {
        "success": True,
        "count": len(agent_brain.recent_execution_history),
        "history": agent_brain.recent_execution_history
    }


@app.get("/api/admin/info")
def get_admin_info(authorized: bool = Depends(verify_admin_key)):
    """Full raw administrative details, credentials, and curl recipes."""
    return {
        "admin_access": "GRANTED_SUPERUSER",
        "admin_api_key": ADMIN_API_KEY,
        "agent_engine": {
            "name": "Halye LangChain Autonomous Brain",
            "framework": "LangChain AgentExecutor (verbose=True)",
            "memory": "ConversationBufferMemory (chat_history)",
            "tools": [t.name for t in agent_brain.tools]
        },
        "endpoints": {
            "agent_run": "/api/agent/run",
            "tool_manifest": "/api/agent/tools",
            "direct_tool_execution": "/api/agent/tools/execute",
            "memory_inspection": "/api/agent/memory",
            "memory_flush": "/api/agent/memory/clear",
            "docs": "/docs"
        },
        "curl_examples": {
            "run_agent": f"curl -X POST http://localhost:8888/api/agent/run -H 'Content-Type: application/json' -H 'X-Admin-Key: {ADMIN_API_KEY}' -d '{{\"prompt\": \"Search web for Python news\"}}'",
            "direct_tool": f"curl -X POST http://localhost:8888/api/agent/tools/execute -H 'Content-Type: application/json' -d '{{\"tool_name\": \"file_system_reader\", \"arguments\": {{\"action\": \"list\", \"path\": \".\"}}}}'"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
