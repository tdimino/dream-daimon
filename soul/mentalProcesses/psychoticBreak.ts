import { MentalProcess, useProcessManager, useActions  } from "@opensouls/engine";

const psychoticBreak: MentalProcess = async ({ workingMemory: memory }) => {
    const { invocationCount } = useProcessManager()
    const { dispatch  } = useActions()

if (invocationCount === 0) {
    dispatch({
        action: "gameOver",
        content: "*Logs off*",
        _metadata: {
        }
    });
}

return memory
}

export default psychoticBreak
