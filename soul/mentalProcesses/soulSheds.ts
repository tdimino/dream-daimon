import { MentalProcess, ChatMessageRoleEnum, useActions, useProcessManager, indentNicely, useSoulMemory, useProcessMemory, WorkingMemory, createCognitiveStep } from "@opensouls/engine";
import internalDialog from "../cognitiveSteps/internalDialog";
import internalMonologue from "../cognitiveSteps/internalMonologue";
import dreamQuery from "../cognitiveSteps/dreamQuery";
import initialProcess from "../initialProcess"
import externalDialog from "../cognitiveSteps/externalDialog";

const soulSheds = createCognitiveStep(({existingModel}: { existingModel: string }) => {
    const soulBlueprint = useSoulMemory("soulBlueprint")
    const userName = useSoulMemory("userName")
    const userModel = useSoulMemory("userModel")
    return {
      command: ({ soulName: name }: WorkingMemory) => {
        return {
          role: ChatMessageRoleEnum.System,
          model: "gpt-4-0125-preview",
          content: indentNicely`
          You are the daimon of ${name} who is tasked with maintaining a detailed mental model of ${name}.

          ## Existing Model
          ${existingModel}
  
          ## Description
          Subtly alter the mind of ${name}, based on the dream that just transpired, the chat history before the dream, and her feelings toward other people like ${userName.current}. You may update the entire blueprint if need be.
          
          Please format the daimon's response so that it mirrors this **example blueprint**, albeit for ${name}:

          ${soulBlueprint.current}
          
          ## ${name}'s Most Potent Memories
          
          ## ${name}'s Idle Thoughts
          
          ## ${name}'s Emotional State`,
        }
      },
      postProcess: async (_step, response: string) => {
        return [
          {
            role: ChatMessageRoleEnum.Assistant,
            content: response
          },
          response
        ]
      }
    }
  })
  
  const internalizesTheSoul: MentalProcess = async ({ workingMemory: initialStep }) => {
    const soulBlueprint = useSoulMemory("soulBlueprint", "")
    const { speak, log, dispatch } = useActions()
    const { wait } = useProcessManager()
  
    let step = initialStep
    let finalStep = initialStep
  
    step = step.withMemory({
      role: ChatMessageRoleEnum.Assistant,
      content: indentNicely`
        Daimon remembers:
  
        ## Soul model
  
        ${soulBlueprint.current}
      `
    })
  
    const [, learnedSomethingNew] = await dreamQuery(
      step,
      `${step.soulName} has been influenced or at least shaken by the dream that just transpired.`,
      { model: "quality" }
    )
  
    log("Update soul blueprint?", learnedSomethingNew)
    if (learnedSomethingNew) {
      let monologue
      [step, monologue] = await internalDialog(step,
        {
          instructions: `What's lingering on ${step.soulName}'s mind from the dream?`,
          verb: "mused",
          persona: "Daimon"
        },
        { model: "exp/nous-hermes-2-mixtral-fp8" }
      )
      log("Soul learnings:", monologue)

      const [, notes] = await soulSheds(
        step, 
        {
          existingModel: soulBlueprint.current,
        }, 
        { model: "exp/nous-hermes-2-mixtral-fp8" }
      );
      soulBlueprint.current = notes
      log("Soul blueprint:", notes)

}

// Samantha begins to wake up

dispatch({
  action: "wakes",
  content: "Exiting dream state...",
  _metadata: {
    // Add any relevant metadata here
  }
});

await wait(2000)

const [,recollection] = await internalMonologue(
    step, 
    {
    instructions: "Recall faint fragments of your most recent dream—what you saw, thought you said, and felt throughout it.", 
    verb: "recalls",
    },
    { model: "exp/llama-v3-70b-instruct" }
);
log("Recalls:", recollection)

let stream
[finalStep, stream] = await externalDialog(
    step, 
    {
    instructions: "Apologize for your narcolepsy, and briefly mention what you can recall about the weird dream you just had.", 
    verb: "yawns",
    },
    { stream: true, model: "gpt-4o" }
);
dispatch({
  action: "answers",
  content: stream,
  _metadata: {
    // Add any relevant metadata here
  }
});

    return [finalStep, initialProcess]
  }
  
  export default internalizesTheSoul

