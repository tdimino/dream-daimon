"use client";

import { Button } from "@/components/button";
import SendMessageForm from "@/components/send-message-form";
import SoulMessage from "@/components/soul-message";
import UserMessage from "@/components/user-message";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Soul, said } from "@opensouls/engine";
import { Fragment, useRef, useState, useEffect } from "react";
import DarkModeBackground from "@/components/DarkModeBackground";
import MadeWithSoulEngine from "@/components/MadeWithSoulEngine";
import JoinDiscord from "@/components/JoinDiscord";

export type ChatMessage =
  | {
      type: "user";
      content: string;
    }
  | {
      type: "soul";
      content: string | AsyncIterable<string>;
      messageType?: string;
    }
  | {
      type: "system";
      content: string;
    };

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Add state for dark mode
  const audioRef = useRef<HTMLAudioElement>(null);

  const { soul, isConnected, reconnect } = useSoul({
    onNewMessage: async (stream: AsyncIterable<string>, type: string) => {
      setIsThinking(type === 'thinks');
      let fullMessage = '';
      try {
        for await (const messageChunk of stream) {
          fullMessage += messageChunk;
        }
        if (type === 'answers') {
          const audioUrl = await convertTextToSpeech(fullMessage, process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID!);
          const audio = new Audio(audioUrl);
          audio.play();
        } else if (type === 'thinks') {
          const audioUrl = await convertTextToSpeech(fullMessage, process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID_DAIMON!);
          const audio = new Audio(audioUrl);
          audio.play();
        } else if (type === 'conjures') { 
          const audioUrl = await convertTextToSpeech(fullMessage, process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID_GENIE!);
          const audio = new Audio(audioUrl);
          audio.play();
        } 
        else if (type === 'sleepCounter') {
          const audioUrl = await convertTextToSpeechForSleepCounter(fullMessage);
          const audio = new Audio(audioUrl);
          await delay(3500); // Delay by 3.5 seconds
          audio.play();
          return; // Skip adding the message to the state
        }
        else if (type === 'dream') {
          const audioUrl = await convertTextToSpeechForSleepCounter(fullMessage);
          const audio = new Audio(audioUrl);
          audio.play();
          return; // Skip adding the message to the state
        }
        else if (type === 'wakes') {
          const audioUrl = await convertTextToSpeechForSleepCounter(fullMessage);
          const audio = new Audio(audioUrl);
          audio.play();
          return; // Skip adding the message to the state
        }
        // else if (type === 'narrates') {
        //   const sanitizedMessage = fullMessage.replace(/[\*#]/g, ''); // Remove all asterisks and hash symbols
        //   const audioUrl = await convertTextToSpeech(sanitizedMessage, process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID_NARRATE!);
        //   const audio = new Audio(audioUrl);
        //   audio.volume = 0.20; // Set volume to 10%
        //   audio.play();
        //   return; // Skip adding the message to the state
        // }
        setMessages((prev) => [
          ...prev,
          {
            type: "soul",
            content: fullMessage,
            messageType: type,
          },
        ]);
      } catch (error) {
        console.error("Error processing message:", error);
      } finally {
        setIsThinking(false); // Ensure isThinking is set to false when done
      }
    },
    onProcessStarted: () => {
      setIsThinking(true);
    },
    onDream: async () => { // Add handler for "dream" event
      setIsDarkMode(true); // Switch to dark mode
      const messageContent = "Entering dream state...";
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: messageContent,
        },
      ]);

      try {
        const audioUrl = await convertTextToSpeechForSleepCounter(messageContent);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (error) {
        console.error("Error playing dream state audio:", error);
      }
    },
    onWake: async () => { // Add handler for "wakes" event
      setIsDarkMode(false); // Switch to light mode
      const messageContent = "Exiting dream state...";
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: messageContent,
        },
      ]);

      try {
        const audioUrl = await convertTextToSpeechForSleepCounter(messageContent);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (error) {
        console.error("Error playing wake state audio:", error);
      }
    },
  });



  async function handleSendMessage(message: string) {
    if (!soul || !isConnected) {
      throw new Error("Soul not connected");
    }

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: message,
      },
    ]);

    await soul.dispatch(said("User", message));

    window.scrollTo(0, document.body.scrollHeight);
  }

  async function convertTextToSpeech(text: string, voiceId: string): Promise<string> {
    try {
      const response = await fetch('/api/convertTextToSpeech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: process.env.NEXT_PUBLIC_ELEVEN_LABS_MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          },
          voiceId: voiceId,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error: ${response.status} - ${errorBody}`);
        throw new Error(`Failed to convert text to speech: ${errorBody}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (error) {
      console.error('Client Error:', error);
      throw error;
    }
  }

  async function convertTextToSpeechForSleepCounter(text: string): Promise<string> {
    try {
      const response = await fetch('/api/convertTextToSpeech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: process.env.NEXT_PUBLIC_ELEVEN_LABS_MODEL_ID_COUNTER, // Use the specific model ID for sleepCounter
          voice_settings: {
            stability: 1.0,
            similarity_boost: 1.0,
            style: 0.0,
            use_speaker_boost: true
          },
          voiceId: process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID_COUNTER, // Use the specific voice ID for sleepCounter
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error: ${response.status} - ${errorBody}`);
        throw new Error(`Failed to convert text to speech: ${errorBody}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (error) {
      console.error('Client Error:', error);
      throw error;
    }
  }

  return (
    <div className="py-6">
      {isDarkMode && <DarkModeBackground />} {/* Conditionally render DarkModeBackground */}
      <div className="fixed top-0 left-0 right-0 flex justify-between p-4">
        <div className="hidden sm:block">
          <MadeWithSoulEngine position="left" />
        </div>
        <div className="hidden sm:block">
          <JoinDiscord position="right" />
        </div>
      </div>
      <div className="mb-10 flex justify-between">
        <div>
          <h1 className={`h-10 text-2xl font-heading sm:text-3xl tracking-tighter ${isDarkMode ? 'matrix-green' : ''}`}> {/* Apply matrix-green class when isDarkMode is true */}
            Samantha Daimon
          </h1>
          <h2 className={`${isDarkMode ? 'matrix-green' : ''} mt-6 sm:mt-0`}>
            <code>helps you explore your inner world!</code>
          </h2>

        </div>

        <div className="flex gap-4">
          <audio ref={audioRef} src="/honk.mp3" hidden></audio>
          <Button
            small
            onClick={() => {
              setTimeout(() => {
                audioRef.current?.play();
              }, 0);
              if (soul && isConnected) {
                soul.dispatch({
                  name: "User",
                  action: "honked",
                  content: "*HONK button pressed*"
                }).catch(console.error);
              }
            }}
            className="text-primary font-medium bg-secondary hover:underline z-10" // Add z-10 class
          >
            HONK
          </Button>

          <Button
            small
            disabled={isConnected && messages.length === 0}
            onClick={() => {
              reconnect().catch(console.error);
              setMessages([]);
              setIsDarkMode(false); // Disable dark mode
            }}
            className="text-primary font-medium [&:not(:disabled):hover]:underline z-10" // Add z-10 class
          >
            Start over
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-6 pb-64">
        <SoulMessage content="*Logs on*" />
        {messages.map((message, i) => (
          <Fragment key={i}>
            {message.type === "user" ? (
              <UserMessage>{message.content}</UserMessage>
            ) : message.type === "soul" ? (
              <SoulMessage content={message.content} messageType={message.messageType} />
            ) : (
              <div className={`text-center ${isDarkMode ? 'matrix-green' : 'text-gray-500'}`}>{message.content}</div>
            )}
          </Fragment>
        ))}
      </div>
      <div className="container max-w-screen-md fixed inset-x-0 bottom-0 w-full">
        <SendMessageForm isConnecting={!isConnected} isThinking={isThinking} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}

function useSoul({
  onNewMessage,
  onProcessStarted,
  onDream,
  onWake,
}: {
  onNewMessage: (stream: AsyncIterable<string>, type: string) => void;
  onProcessStarted: () => void;
  onDream: () => Promise<void>; // Update the type to Promise<void>
  onWake: () => Promise<void>; // Update the type to Promise<void>
}) {
  const soulRef = useRef<Soul | undefined>(undefined);

  const [isConnected, setIsConnected] = useState(false);

  async function connect() {
    console.log("connecting soul...");

    const soulInstance = new Soul({
      organization: process.env.NEXT_PUBLIC_OPENSOULS_ORG_ID!,
      blueprint: process.env.NEXT_PUBLIC_OPENSOULS_BLUEPRINT!,
    });

    soulInstance.on("newSoulEvent", (event) => {
      if (event.action === "mainThreadStart") {
        onProcessStarted();
      }
    });
    soulInstance.on("answers", async ({ stream }) => {
      onNewMessage(await stream(), 'answers');
    });

    soulInstance.on("thinks", async ({ stream }) => {
      onNewMessage(await stream(), 'thinks');
    });

    soulInstance.on("conjures", async ({ stream }) => {
      onNewMessage(await stream(), 'conjures');
    });

    soulInstance.on("sleepCounter", async ({ stream }) => {
      onNewMessage(await stream(), 'sleepCounter');
    });

    soulInstance.on("narrates", async ({ stream }) => {
      onNewMessage(await stream(), 'narrates');
    });

    soulInstance.on("dream", async ({ stream }) => {
      await onDream(); // Await the onDream function
      // Skip adding the message to the state
    });

    soulInstance.on("wakes", async ({ stream }) => {
      await onWake(); // Await the onWake function
      // Skip adding the message to the state
    });

    await soulInstance.connect();
    console.log(`soul connected with id: ${soulInstance.soulId}`);

    soulRef.current = soulInstance;
    setIsConnected(true);
  }

  async function disconnect() {
    if (soulRef.current) {
      await soulRef.current.disconnect();
      setIsConnected(false);
      console.log("soul disconnected");
    }

    soulRef.current = undefined;
  }

  async function reconnect() {
    await disconnect();
    await connect();
  }

  useOnMount(() => {
    connect().catch(console.error);

    return () => {
      disconnect();
    };
  });

  return { soul: soulRef.current, isConnected, reconnect };
}