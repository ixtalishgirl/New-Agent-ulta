"""
Streamlit Web UI for Halye LangChain Agentic Brain Admin Console.
Run with: streamlit run langchain_agent/streamlit_app.py
"""

import streamlit as st
import requests
import json
import time

st.set_page_config(
    page_title="Halye LangChain Admin Console",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Configuration
API_BASE = st.sidebar.text_input("FastAPI Base URL", value="http://localhost:8888")
ADMIN_KEY = st.sidebar.text_input("Admin API Key", value="sk-halye-raw-access-admin", type="password")

st.sidebar.markdown("---")
st.sidebar.markdown("### 🛠️ Tool Arsenal")
try:
    tools_res = requests.get(f"{API_BASE}/api/agent/tools", timeout=3)
    if tools_res.status_code == 200:
        tools_data = tools_res.json().get("tools", [])
        for t in tools_data:
            st.sidebar.markdown(f"**`{t['name']}`**")
            st.sidebar.caption(t.get("description", ""))
except Exception:
    st.sidebar.info("FastAPI backend offline or connecting...")

# Main Layout
st.title("⚡ Halye LangChain Agentic Brain")
st.caption("Autonomous AgentExecutor • ConversationBufferMemory • Full Raw Administrative Access")

tabs = st.tabs(["🚀 Agent Executor Console", "🔧 Direct Tool Sandbox", "🧠 Memory Inspector", "🔑 Admin Credentials & API Docs"])

with tabs[0]:
    st.subheader("Interactive AgentExecutor")
    col1, col2 = st.columns([3, 1])
    with col1:
        prompt_input = st.text_area("Prompt / Autonomous Directive", "Search the web for the latest updates on Python LangChain in 2026", height=100)
    with col2:
        framework = st.selectbox("Framework", ["tool_calling", "react"])
        run_btn = st.button("⚡ Execute Directive", use_container_width=True, type="primary")

    if run_btn and prompt_input:
        with st.spinner("AgentExecutor running with verbose=True..."):
            try:
                res = requests.post(
                    f"{API_BASE}/api/agent/run",
                    json={"prompt": prompt_input, "framework": framework},
                    headers={"X-Admin-Key": ADMIN_KEY},
                    timeout=30
                )
                if res.status_code == 200:
                    data = res.json()
                    st.success(f"Execution completed in {data.get('execution_time_ms', 0)}ms")
                    
                    st.markdown("### Final Answer")
                    st.markdown(data.get("output", ""))
                    
                    # Intermediate Steps & Thought Logs
                    steps = data.get("intermediate_steps", [])
                    if steps:
                        with st.expander(f"🔍 Intermediate Steps & Observations ({len(steps)})", expanded=True):
                            for idx, step in enumerate(steps, 1):
                                st.markdown(f"**Step {idx}: Invoked Tool `{step.get('tool')}`**")
                                st.caption(f"Input: `{step.get('tool_input')}`")
                                if step.get("thought_log"):
                                    st.code(step["thought_log"], language="text")
                                st.markdown("**Observation:**")
                                st.code(step.get("observation", "")[:1500], language="json")
                else:
                    st.error(f"API Error {res.status_code}: {res.text}")
            except Exception as e:
                st.error(f"Connection failed: {str(e)}")

with tabs[1]:
    st.subheader("Direct Tool Execution Sandbox")
    st.write("Execute tools directly without LLM orchestration.")
    tool_sel = st.selectbox("Select Tool", ["web_search", "file_system_reader", "api_execution_tool", "terminal_command_executor"])
    
    if tool_sel == "web_search":
        q = st.text_input("Query", "LangChain release notes")
        t_args = {"query": q, "max_results": 5}
    elif tool_sel == "file_system_reader":
        act = st.selectbox("Action", ["list", "read", "exists", "write"])
        p = st.text_input("Path", ".")
        c = st.text_area("Content (if writing)", "")
        t_args = {"action": act, "path": p, "content": c}
    elif tool_sel == "api_execution_tool":
        method = st.selectbox("Method", ["GET", "POST"])
        url = st.text_input("URL", "http://localhost:3000/api/project/active")
        t_args = {"method": method, "url": url, "headers_json": "{}", "payload_json": "{}"}
    else:
        cmd = st.text_input("Command", "uname -a")
        t_args = {"command": cmd}

    if st.button("Run Tool Directly"):
        try:
            res = requests.post(f"{API_BASE}/api/agent/tools/execute", json={"tool_name": tool_sel, "arguments": t_args})
            st.json(res.json())
        except Exception as e:
            st.error(str(e))

with tabs[2]:
    st.subheader("ConversationBufferMemory State")
    c_btn, r_btn = st.columns(2)
    with c_btn:
        if st.button("Refresh Memory"):
            st.rerun()
    with r_btn:
        if st.button("Flush / Clear Memory", type="secondary"):
            requests.post(f"{API_BASE}/api/agent/memory/clear")
            st.success("Memory cleared")
            st.rerun()
            
    try:
        mem_res = requests.get(f"{API_BASE}/api/agent/memory")
        if mem_res.status_code == 200:
            msgs = mem_res.json().get("messages", [])
            st.write(f"Total stored messages: {len(msgs)}")
            for m in msgs:
                with st.chat_message(m.get("role", "user")):
                    st.write(m.get("content", ""))
    except Exception as e:
        st.error(str(e))

with tabs[3]:
    st.subheader("Admin Credentials & Raw API Reference")
    st.code(f"""
# Environment Variables & Admin Tokens
ADMIN_API_KEY = "sk-halye-raw-access-admin"
FASTAPI_BASE_URL = "http://localhost:8000"
EXPRESS_PROXY_URL = "http://localhost:3000/api/agent"

# Run Agent via cURL
curl -X POST http://localhost:3000/api/agent/run \\
  -H "Content-Type: application/json" \\
  -H "X-Admin-Key: sk-halye-raw-access-admin" \\
  -d '{{"prompt": "Audit package.json dependencies"}}'

# Fetch Tool Schemas
curl -X GET http://localhost:3000/api/agent/tools
    """, language="bash")
