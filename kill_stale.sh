#!/bin/bash
# Kill client and server stale processes
kill $(lsof -t -i:8080) # Client
kill $(lsof -t -i:2567)	# Server