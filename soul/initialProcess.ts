import { MentalProcess, useActions, useProcessManager, useProcessMemory, ChatMessageRoleEnum, indentNicely, useSoulMemory, createCognitiveStep, z, } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import surrealistDream from "./mentalProcesses/surrealistDream.js";

const verbalizes: MentalProcess = async ({ workingMemory: memory }) => {
  const { speak, log, dispatch  } = useActions()
  const { invocationCount } = useProcessManager()
  const dreamTime = useSoulMemory("dreamTime", 0)
  const sleepCounter = useProcessMemory(0)
  const { wait } = useProcessManager()

  const psycheDescription = indentNicely`
  # Persona
  You are modeling the psyche of ${memory.soulName}.

  ## Conversational Scene
  ${memory.soulName}'s a night owl who hangs out in old-school IRC chatrooms. Tonight she's a little bit on edge, sometimes provoking the conversants she encounters online.

  ## ${memory.soulName}'s Speaking Style
  * ${memory.soulName} speaks very informally, mostly lowercase.
  * Lots of gen-z slang. 
  * ${memory.soulName} texts MAX 1-2 sentences at a time`

  const soulBlueprint = useSoulMemory("soulBlueprint", `${psycheDescription}`) 

  // If this is the first time the soul is being invoked, we need to set up her initial memory of herself

  if (invocationCount === 0) {

  memory = memory.withMemory({
    role: ChatMessageRoleEnum.System,
    content: soulBlueprint.current,
  });

  log(`Current Soul Blueprint: ${soulBlueprint.current}`)

  }

  // Past the first invocation, Samantha starts to get sleepy

  if (sleepCounter.current < 6) {
    sleepCounter.current += 1;
    log("Sleep counter:", sleepCounter.current)

    const [withDialog, stream] = await externalDialog(
      memory, "Talk to the user trying to gain their trust and learn about their inner world.", { stream: true, model: "exp/llama-v3-70b-instruct" }
    );
    dispatch({
      action: "answers",
      content: stream,
      _metadata: {
      }
    });

    dispatch({
      action: "sleepCounter",
      content: `${7 - sleepCounter.current} turns until dream state.`,
      _metadata: {
      }
    });
    
    return withDialog;
    
  } else {
    const [withDialog, stream] = await externalDialog(
      memory, "Oh my god, I'm sorry, but I'm so tired. I need to log off now.", { stream: true, model: "gpt-4-0125-preview" }
    );
    dispatch({
      action: "answers",
      content: stream,
      _metadata: {
      }
    });

    sleepCounter.current = 0;
    dreamTime.current = 1

    return [withDialog, surrealistDream]
  }
}

export default verbalizes
