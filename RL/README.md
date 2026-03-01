There are 2 additional http endpoints for training the model/bot. Test them manually like so:

RESET
-----
curl -X POST http://localhost:3000/rl/reset \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq

-> Grep session Id
| jq -r '.sessionId'

STEP
-----
curl -X POST http://localhost:3000/rl/step \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"b0e7bad7-c2c4-4a6f-b76e-0823d68251a5","action":2}' \
  | jq

-> Actions:
* 0 = keep current direction (no-op)
* 1 = left
* 2 = up
* 3 = right
* 4 = down

-> Pipe for Visual
| jq -r '
  .obs.board
  | group_by(.y)
  | sort_by(.[0].y)
  | .[]
  | sort_by(.x)
  | map(if .color == "blue" then "B" else "0" end)
  | join(" ")
'









To run train the model first start the Node Server so endpoints are alive, then in RL/python:

python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_ppo.py






To run the server which serves the bot decisions at runtime to the nodebackend, in RL/python:

source .venv/bin/activate
pip install -r requirements.txt
uvicorn policy_server:app --host 0.0.0.0 --port 8000