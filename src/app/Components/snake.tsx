"use client";

import React, { KeyboardEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { FaRedo, FaPlay, FaPause, FaStar } from "react-icons/fa";
import useSound from "use-sound";
import CongratsModal from "./CongratsModal";
import URLParams from "./URLParams";
import { debounce } from "lodash";

const GRID_SIZE = 10;
const INITIAL_SNAKE_LENGTH = 3;
const INITIAL_DIRECTION: Direction = "DOWN";
const FOOD_COUNT = 2; // Number of food items on the board

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type Point = {
  x: number;
  y: number;
  value?: number; // Optional value property
};

export default function Snake() {
  const [snake, setSnake] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ]);
  const [food, setFood] = useState<Point[]>([]); // Multiple food items
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const[VALUE_COUNT,setStateVALUE] = useState<number>(1);
  const[VALUE_COUNT_OFF,setStateVALUEOFF] = useState<number>(1);
  const [lastEatenValue, setLastEatenValue] = useState<number>(2);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState<number>(200); // Initial speed
  const previousLastEatenValue = useRef<number>(lastEatenValue); // Track previous value
  const [score, setScore] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isGameSoundPlaying, setIsGameSoundPlaying] = useState<boolean>(false);
  // const searchParams = useSearchParams();
  // const campaignId = searchParams.get("campaign_id"); // Fetch 'value' from URL
  // const userId = searchParams.get("user_id"); // Fetch 'userId' from URL
  const [campaignId, setCampaignId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    gameContainerRef.current?.focus();
    // if (campaignId) {
    //   console.log("Fetched value from URL:", campaignId);
    // }
  }, []);
  const saveScore =async(user_id:string,scores:number)=>{
    try{
    const response = await fetch('http://192.168.0.5:8094/saveScore',{
    // const response = await fetch('http://103.99.202.191/saveScore',{
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "user_id":(user_id||userId||1),
        "score":(scores||score)
      })
    })
    console.log(response);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
    }catch(e){
      console.log('error in Catch',e.message)
    }
  }


  const [game ,{ stop, pause, }] = useSound('/game.mp3', {
    volume: 0.5,
    loop:true,
    soundEnabled: true,
    // interrupt: true,
    onload: () => console.log('Spin sound loaded'),
    onloaderror: (id, error) => console.error('Spin sound load error:', error),
    onplay: () => setIsGameSoundPlaying(true),
    // onend: () => setIsGameSoundPlaying(false),
    onstop: () => setIsGameSoundPlaying(false),
  });
  const [lose,{ stop: stopLose }] = useSound('/lose.mp3', {
    volume: 1,
    // playbackRate:0.8,
    loop:true,
    soundEnabled: true,
    interrupt: true,
    onload: () => console.log('Spin sound loaded'),
    onloaderror: (id, error) => console.error('Spin sound load error:', error)
  });
  const [point] = useSound('/point.mp3', {
    volume: 1,
    loop:false,
    soundEnabled: true,
    interrupt: true,
    onload: () => console.log('Spin sound loaded'),
    onloaderror: (id, error) => console.error('Spin sound load error:', error)
  });
  const [win] = useSound('/win.mp3', {
    volume: 0.5,
    loop:false,
    soundEnabled: true,
    interrupt: true,
    onload: () => console.log('Spin sound loaded'),
    onloaderror: (id, error) => console.error('Spin sound load error:', error)
  });


  const replaceFood = (index: number,value:number): void => {
    setFood((prevFood) => {
      const newFood = [...prevFood];

      let x, y;
      const foodCluster: { x: number; y: number; value: number }[] = [];

      // Next value should be 2× the last eaten value
      const nextValue = (value||lastEatenValue) * 2;

      let attempts = 0;
      while (foodCluster.length < 2 + Math.floor(Math.random() * 2) && attempts < 20) { // Generate 2-3 food items
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);

        // Ensure new food does not overlap with the snake or existing food
        if (
          !snake.some((s) => s.x === x && s.y === y) &&
          !newFood.some((f) => f.x === x && f.y === y) &&
          !foodCluster.some((f) => f.x === x && f.y === y)
        ) {
          foodCluster.push({ x, y, value: nextValue });
        }

        attempts++;
      }

      // Replace the eaten food item with the first new one
      if (foodCluster.length > 0) {
        newFood[index] = foodCluster.shift()!;
      }

      // Add remaining food items to the food array
      newFood.push(...foodCluster);

      return newFood;
    });

    // Update the last eaten value to its next exponential step
    setLastEatenValue((prev) => prev * 2);
  };


  const generateInitialFood = (): void => {
    const newFood: { x: number; y: number; value: number }[] = [];

    while (newFood.length < FOOD_COUNT) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const value = 2 ** (Math.floor(Math.random() * VALUE_COUNT) + VALUE_COUNT_OFF); // Generates values: 2, 4, 8, 16, 32

      if (!snake.some((s) => s.x === x && s.y === y) && !newFood.some((f) => f.x === x && f.y === y)) {
        newFood.push({ x, y, value });
      }
    }
    setFood(newFood);
  };

  const moveSnake = (): void => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    // Predict the next position based on the current direction
    let nextX = head.x;
    let nextY = head.y;

    switch (direction) {
      case "UP":
        nextY -= 1;
        break;
      case "DOWN":
        nextY += 1;
        break;
      case "LEFT":
        nextX -= 1;
        break;
      case "RIGHT":
        nextX += 1;
        break;
    }

    // Check if the predicted move hits a wall or itself
    if (
      nextX < 0 ||
      nextX >= GRID_SIZE ||
      nextY < 0 ||
      nextY >= GRID_SIZE ||
      newSnake.some((segment) => segment.x === nextX && segment.y === nextY)
    ) {
      // lose()
      setIsOpen(true);
      if( isGameSoundPlaying ===true){
        stop()
        setIsGameSoundPlaying(false);
      }
      setGameOver(true);
      setIsRunning(false);
      saveScore(userId,score);
      // setTimeout(()=>{stopLose()},800)
      return;
    }

    // Check if there is food in the next position BEFORE moving
    const foodIndex = food.findIndex((f) => f.x === nextX && f.y === nextY);

    if (foodIndex !== -1) {
      const foodValue = food[foodIndex].value;

      // If food does NOT match the equation, change direction BEFORE moving
      if (
        foodValue != lastEatenValue * 2 &&
        // foodValue != lastEatenValue / 2
        //  &&
        foodValue != lastEatenValue
      ) {
        setGameOver(true);
        setIsRunning(false);
        saveScore(userId,score);
        if(isGameSoundPlaying === true){
          stop()
        }
        setIsOpen(true);
        // changeDirection(); // Pick a new valid direction
        return; // Stop movement this frame
      }
    }

    // If direction was not changed, move forward
    newSnake.unshift({ x: nextX, y: nextY });
    const foodValue = food[foodIndex]?.value;

    // Remove tail only if food was not eaten
    if (foodIndex === -1) {
      newSnake.pop();
    } else if(foodValue === lastEatenValue * 2) {
      // If food was eaten, replace it
      point()
      setScore((prevScore) => prevScore + 2);
      setLastEatenValue(food[foodIndex].value,);
      replaceFood(foodIndex,food[foodIndex].value);
    // }else if(foodValue === lastEatenValue / 2){
    //   setLastEatenValue(food[foodIndex].value);
    //   point()
    //   replaceFood(foodIndex,food[foodIndex].value);
    }else if(
      foodValue === lastEatenValue){
        point()
        setScore((prevScore) => prevScore + 2);
    // setLastEatenValue(food[foodIndex].value);
    replaceFood(foodIndex,food[foodIndex].value);
    }

    setSnake(newSnake);
  };


    const initGame = (): void => {
      const initialSnake: Point[] = [];
      for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        initialSnake.push({ x: i, y: 0 });
      }
      if(isGameSoundPlaying ==false){
        game()
        setIsGameSoundPlaying(true);
      }
      setStarted(true)
      setSnake(initialSnake);
      generateInitialFood();
    };
    useEffect(()=>{
      console.log(previousLastEatenValue.current,lastEatenValue)
      if(lastEatenValue > previousLastEatenValue.current){
        setSpeed((prevSpeed)=>Math.max(prevSpeed-40,80))
        previousLastEatenValue.current = lastEatenValue; // Update reference
      }
    },[lastEatenValue])
    useEffect(() => {
      if (isRunning && !gameOver && started) {
        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
      }
    }, [snake, direction,isRunning]);


    const handleKeyPress =debounce((event: KeyboardEvent<HTMLDivElement>): void => {
        console.log("event.key", event.key, !gameOver, isRunning);

        if (!gameOver && isRunning) {
          const key = event.key.toLowerCase(); // Normalize for WASD keys

          if ((key === "arrowup" || key === "w") && direction !== "DOWN") {
            setDirection("UP");
          } else if ((key === "arrowdown" || key === "s") && direction !== "UP") {
            setDirection("DOWN");
          } else if ((key === "arrowleft" || key === "a") && direction !== "RIGHT") {
            setDirection("LEFT");
          } else if ((key === "arrowright" || key === "d") && direction !== "LEFT") {
            setDirection("RIGHT");
          }
        }
      }, speed)
  const handleRestart = () => {
    setIsOpen(false)
    // if(isGameSoundPlaying){
    //   stop()
    //   }
    if(isRunning == true ){
      setIsRunning(false);
    }
    setSnake([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    setDirection(INITIAL_DIRECTION);
    // initGame();
    setFood([])
    setGameOver(false);
    setLastEatenValue(2);
    setStarted(false);
    setScore(0);
    // setIsRunning(true);
    // generateInitialFood();
    // setFood(generateInitialFood());
  };
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      initGame(); // Start game after countdown
      setIsRunning(true);
      // gameContainerRef.current?.focus(); // Ensure the container gets focus
    }
  }, [countdown]);
  const handleStart = () => {
    setCountdown(3); // Start countdown from 3
    // initGame();
    // setIsRunning(true);
    gameContainerRef.current?.focus(); // Ensure the container gets focus

  };
  const handlePause = () =>{
    if(isRunning==true){
      setIsRunning(false)
      if(isGameSoundPlaying ===true){
      stop()
      setIsGameSoundPlaying(false);
      }
    }
    else if(isRunning ==false){
      setIsRunning(true)
      if(isGameSoundPlaying===false){
        game()
        setIsGameSoundPlaying(true);
      }
    }
  };
  const handleToggleGame = () => {
    if (!started) {
      handleStart();
      setStarted(true);
    }else if(gameOver){
      handleRestart()
    }
     else if(countdown==0) {
      handlePause();
    }
  };

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
};

const handleTouchEnd = debounce((e: React.TouchEvent) => {
  if (!touchStart) return;

  const deltaX = e.changedTouches[0].clientX - touchStart.x;
  const deltaY = e.changedTouches[0].clientY - touchStart.y;
    console.log("event.key", e.changedTouches[0], !gameOver, isRunning);

    if (!gameOver && isRunning) {

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 30 && direction !== "LEFT") setDirection("RIGHT");
    if (deltaX < -30 && direction !== "RIGHT") setDirection("LEFT");
  } else {
    if (deltaY > 30 && direction !== "UP") setDirection("DOWN");
    if (deltaY < -30 && direction !== "DOWN") setDirection("UP");
  }
}


  setTouchStart(null);
}, speed-20)
const foodColors: Record<number, string> = {
  2: "bg-pink-400",
  4: "bg-purple-400",
  8: "bg-fuchsia-400",
  16: "bg-violet-400",
  32: "bg-rose-400",
  64: "bg-indigo-400",
  128: "bg-pink-500",
  256: "bg-purple-500",
  512: "bg-fuchsia-500",
  1024: "bg-violet-500",
  2048: "bg-rose-500",
  4096: "bg-indigo-500",
  8192: "bg-pink-600",
  16384: "bg-purple-600",
  32768: "bg-fuchsia-600",
  65536: "bg-violet-600",
  131072: "bg-rose-600",
  262144: "bg-indigo-600",
  524288: "bg-pink-700",
  1048576: "bg-purple-700",
  2097152: "bg-fuchsia-700",
  4194304: "bg-violet-700",
  8388608: "bg-rose-700",
};
// const getFoodColor = (value: number) => foodColors[value] || "bg-pink-400";
const getFoodColor = (foodValue: number | undefined, lastEatenValue: number): string => {
  if (!foodValue) return "bg-gray-500";
  if (foodValue === lastEatenValue * 2 || foodValue === lastEatenValue) {
    return "bg-pink-300";
  }
  return "bg-pink-800";
};
// const triggerConfetti = () => {
//   confett({
//     particleCount: 100,
//     spread: 70,
//     origin: { y: 0.6 }
//   });
// };
  return (
    <Suspense
    fallback={<p>Loading </p>}>
      <URLParams setCampaignId={setCampaignId} setUserId={setUserId}  />
    <div
     ref={gameContainerRef}
     style={{ backgroundImage: "url('/back.jpg')", backgroundSize: "cover" ,backgroundPosition: "center",backgroundRepeat: "no-repeat"}}
     className="flex justify-center justify-items-center h-[100vh] flex-col px-4 bg-cover bg-center bg-no-repeat" onKeyDown={handleKeyPress} tabIndex={0} onClick={handleToggleGame}
      onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}   autoFocus>
     {/* <CongratsMod al isOpen={isOpen} setIsOpen={setIsOpen} score={score} /> */}

    {/* Game Rules */}
    <div className=" flex-col flex  md:flex-row gap-0 md:gap-10 items-center">
      <div className=" flex flex-col items-center">
 {!started&&<h1 className="text-xl md:text-4xl font-bold mb-2 animate-none md:animate-bounce text-pink-500 text-center text-shadow-md shadow-pink-200 mt-4">Snake Game</h1>}

    {/* {lastEatenValue &&<h2 className="text-lg md:text-2xl font-bold mb-2 text-white"> ON FOOD : {lastEatenValue/2}</h2>} */}
    {!started && (
          <button
            className="bg-violet-200  hover:bg-violet-300 text-purple-900 px-5 py-2 rounded-full flex items-center gap-2 shadow-md transition mb-3"
            onClick={handleStart}
          >
            <FaPlay />
            Start
          </button>
        )}
    {!started&&<div className="bg-white bg-opacity-50 text-gray-800 p-2 md:p-3 rounded-lg shadow-md max-w-lg w-full h-fit text-xs md:text-base mb-3">
        <h3 className="font-bold text-sm md:text-lg mb-2 text-purple-700">Game Rules:</h3>
        <ul className="list-disc list-inside space-y-1 text-white">
          <li><span className="font-bold text-white text-xs md:text-md">Movement:</span> Use arrow keys or WASD. Swipe on mobile.</li>
          <li><span className="font-bold text-white text-xs md:text-md">Objective:</span> To reach food maximum value.</li>
          <li><span className="font-bold text-white text-xs md:text-md">Food Values:</span> Must eat  value * 2 or value.</li>
          <li><span className="font-bold text-white text-xs md:text-md">Game Over:</span> Hitting walls, itself, or eating the wrong food.</li>
          <li><span className="font-bold text-white text-xs md:text-md">Play:</span>To start click anywhere, same for pause.</li>
        </ul>
      </div>}
      </div>
      <div className="items-center flex flex-col">
 <div className="flex gap-4 mb-4 z-30">
 {started && gameOver&& (<button
          className="bg-purple-200 hover:bg-purple-300 text-violet-950  px-2 sm:px-5 py-2 rounded-full flex items-center gap-2 shadow-md transition text-xs sm:text-lg"
          onClick={handleRestart}
          >
          <FaRedo />
          Reset
        </button>
      )}



        {started && !gameOver&& countdown==0&& (
          <button
          className="bg-pink-300 hover:bg-pink-400 text-pink-950 px-1 sm:px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition text-xs sm:text-lg"
          onClick={handlePause}
          >
            <FaPause />
            Pause
          </button>
        )}
   <div className="bg-yellow-300 text-yellow-950 px-2 sm:px-5 py-2 rounded-full flex items-center gap-2 shadow-md transition font-bold text-xs sm:text-lg">
    <FaStar /> {/* You can use any icon here */}
    Score: {score}
  </div>
  {(started &&countdown != null) &&
          <div className="text-lg sm:text-4xl font-bold animate-pulse text-white">
            { countdown ==0?'Game started':countdown }
          </div>
      // ) : (
      //   <div ref={gameContainerRef} className="text-2xl">
      //     Game Running...
      //   </div>
      // )
      }


      </div>


        <div className="relative w-fit h-[100vh] max-w-[90vw] flex flex-col items-center border-4 p-1 sm:p-6 bg-black">
        {gameOver && (
         <div className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-70 z-20">
            <div className="text-3xl md:text-6xl font-bold text-pink-600">
              Game Over!
            </div>
            <div className="text-xl md:text-3xl font-bold text-violet-800 mt-4">
              Score: {score}
            </div>
        </div>
        )}
        {Array.from({ length: GRID_SIZE }).map((_, y) =>{
          return(
            <div key={y} className="flex w-fit">
            {Array.from({ length: GRID_SIZE }).map((_, x) => {
               const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
               const isFood = food.some((f) => f.x === x && f.y === y);
               const isHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
               const isTail = snake.length > 1 && snake[snake.length - 1].x === x && snake[snake.length - 1].y === y
               let headRoundedClass = "";
               let semiCirclePosition = "";
               if (isHead) {
                 if (direction === "UP") {
                   headRoundedClass = "rounded-t-xl";
                   semiCirclePosition = "top-[-3px] md:top-[-18px]  left-1/2 transform -translate-x-1/2  w-[5vw] h-[5vw] sm:w-[3vw] sm:h-[3vw] ";
                  }
                 if (direction === "DOWN") {
                   headRoundedClass = "rounded-b-xl";
                   semiCirclePosition = "bottom-[-3px] md:bottom-[-18px] left-1/2 transform -translate-x-1/2 w-[5vw] h-[5vw] sm:w-[3vw] sm:h-[3vw]  ";
                  }
                  if (direction === "LEFT") {
                    headRoundedClass = "rounded-l-xl";
                   semiCirclePosition = "left-[-3px] md:left-[-18px] top-1/2 transform -translate-y-1/2 w-[5vw] h-[5vw] sm:w-[3vw] sm:h-[3vw]  ";
                  }
                 if (direction === "RIGHT") {
                   headRoundedClass = "rounded-r-xl ";
                   semiCirclePosition = "right-[-3px] md:right-[-20px] top-1/2 transform -translate-y-1/2 w-[5vw] h-[5vw] sm:w-[3vw] sm:h-[3vw] ";
                  }
               }

               // Determine tail direction based on second-last segment
               let tailRoundedClass = "";
               let tailSemiCirclePosition = "";
               if (isTail && snake.length > 1) {
                 const secondLast = snake[snake.length - 2];

                 if (secondLast.y > snake[snake.length - 1].y) {
                   tailRoundedClass = "rounded-t-full"; // Moving down
                   tailSemiCirclePosition = "top-[-20px] left-1/2 transform -translate-x-1/2";
                  }
                  if (secondLast.y < snake[snake.length - 1].y) {
                   tailRoundedClass = "rounded-b-full"; // Moving up
                   tailSemiCirclePosition = "bottom[-20px] left-1/2 transform -translate-x-1/2";
                  }
                 if (secondLast.x > snake[snake.length - 1].x) {
                   tailRoundedClass = "rounded-l-full"; // Moving right
                   tailSemiCirclePosition = "left-[-20px] top-1/2 transform -translate-y-1/2";
                  }
                  if (secondLast.x < snake[snake.length - 1].x) {
                   tailRoundedClass = "rounded-r-full"; // Moving left
                   tailSemiCirclePosition = "rigth-[-20px] top-1/2 transform -translate-y-1/2";
                 }
               }
              return(
              <div
                key={x}
                className={`w-[6vw] h-[6vw] sm:w-[3vw] sm:h-[3vw] flex items-center justify-center relative p-0 m-0.5 sm:m-1

                  ${isSnake ? "bg-purple-800 rounded-md border transition-shadow duration-150 shadow-md shadow-slate-300 " : ""}
                  ${isFood ? `${getFoodColor(food.some((f) => f.x === x && f.y === y) && food.find((f) => f.x === x && f.y === y)?.value,lastEatenValue)} text-white  text-xs font-bold rounded-md shadow-sm shadow-white animate-pulse motion-safe:true `: ""}
                  ${headRoundedClass}
                  ${tailRoundedClass}
                `}
                >
                {food.some((f) => f.x === x && f.y === y) && food.find((f) => f.x === x && f.y === y)?.value}
                {isHead && (
                  <div className={`absolute bg-purple-800 rounded-full ${semiCirclePosition}`}>

                  {direction === "UP" && (
                      <>
                        <div className="absolute bg-white w-[6px] h-[6px] xl:w-[1vw] xl:h-[1vw] md:w-[0.5vw] md:h-[0.5vw] rounded-full left-[10%] top-[15%] animate-spin"></div>
                        <div className="absolute bg-white w-[6px] h-[6px] xl:w-[1vw] xl:h-[1vw] md:w-[0.5vw] md:h-[0.5vw] rounded-full right-[10%] top-[15%] animate-spin"></div>
                        {/* Pupils */}
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full left-[17%] top-[18%] animate-spin"></div>
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full right-[17%] top-[18%] animate-spin"></div>
                      </>
                    )}

                    {direction === "DOWN" && (
                      <>
                        <div className="absolute bg-white w-[6px] h-[6px] xl:w-[1vw] xl:h-[1vw] md:w-[1vw] md:h-[1vw] rounded-full left-[10%] bottom-[15%] animate-spin"></div>
                        <div className="absolute bg-white w-[6px] h-[6px] xl:w-[1vw] xl:h-[1vw] md:w-[1vw] md:h-[1vw] rounded-full right-[10%] bottom-[15%] animate-spin"></div>
                        {/* Pupils */}
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full left-[17%] bottom-[18%] animate-spin"></div>
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full right-[17%] bottom-[18%] animate-spin"></div>
                      </>
                    )}

                    {direction === "LEFT" && (
                      <>
                        <div className="absolute bg-white w-[6px] h-[6px]  md:w-[1vw] md:h-[1vw] rounded-full left-[15%] top-[10%] animate-spin"></div>
                        <div className="absolute bg-white w-[6px] h-[6px]  md:w-[1vw] md:h-[1vw] rounded-full left-[15%] bottom-[10%] animate-spin"></div>
                        {/* Pupils */}
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full left-[20%] top-[14%] animate-spin"></div>
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full left-[20%] bottom-[14%] animate-spin"></div>
                      </>
                    )}

                    {direction === "RIGHT" && (
                      <>
                        <div className="absolute bg-white w-[6px] h-[6px]  md:w-[1vw] md:h-[1vw] rounded-full right-[15%] top-[10%] animate-spin"></div>
                        <div className="absolute bg-white w-[6px] h-[6px]  md:w-[1vw] md:h-[1vw] rounded-full right-[15%] bottom-[10%] animate-spin"></div>
                        {/* Pupils */}
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full right-[20%] bottom-[14%] animate-spin"></div>
                        <div className="absolute bg-black w-[3px] h-[3px] md:w-[0.8vw] md:h-[0.8vw] rounded-full right-[20%] top-[14%] animate-spin"></div>
                      </>
                    )}

                    {/* Tongue - Adjusted Rotation */}
                    {/* <div className={`absolute bg-red-500 w-[2px] h-[12px] md:h-[18px]
                      ${direction === "UP" ? "top-[-10px] left-1/2 -translate-x-1/2 animate-pulse" : ""}
                      ${direction === "DOWN" ? "bottom-[-2px] left-1/2 -translate-x-1/2 animate-pulse" : ""}
                      ${direction === "LEFT" ? "left-[-10px] top-1/2 -translate-y-1/2 rotate-90  animate-pulse" : ""}
                      ${direction === "RIGHT" ? "right-[-10px] top-1/2 -translate-y-1/2 -rotate-90 animate-pulse" : ""}`}>
                    </div> */}

                    </div>
                    )}
                    {/* {isTail && (
                       <div
                        className={`absolute w-14 h-14 bg-green-100 rounded-full ${tailSemiCirclePosition}`}
                        ></div>
                        )} */}
              </div>
            )})}
          </div>
        )})}
        {/* </div> */}
      </div>
      </div>
      </div>
    </div>
</Suspense>
  );
}

{/* {isSnake && (
  <div className="relative w-full h-full flex justify-center items-center">
  {(() => {
      const dotCount = Math.floor(Math.random() * 4) + 1; // 1 to 4 dots
      const usedPositions: { top: string; left: string }[] = [];

      return Array.from({ length: dotCount }).map((_, index) => {
        let randomTop, randomLeft;
        let attempts = 0;

        // Generate non-overlapping dots
        do {
          randomTop = `${Math.floor(Math.random() * 70) + 10}%`; // Between 10% and 80% of the div
          randomLeft = `${Math.floor(Math.random() * 70) + 10}%`; // Between 10% and 80%
          attempts++;
        } while (
          usedPositions.some(
            (pos) =>
              Math.abs(parseInt(pos.top) - parseInt(randomTop)) < 15 &&
              Math.abs(parseInt(pos.left) - parseInt(randomLeft)) < 15
          ) &&
          attempts < 10
        );

        usedPositions.push({ top: randomTop, left: randomLeft });

        return (
          <div
            key={index}
            className="absolute w-2 h-2 bg-black rounded-full"
            style={{ top: randomTop, left: randomLeft }}
          ></div>
        );
      });
    })()}
  </div>
)} */}

  // const replaceFood = (index: number): void => {
  //   setFood((prevFood) => {
  //     const newFood = [...prevFood];
  //     let x, y, value;
  //     do {
  //       x = Math.floor(Math.random() * GRID_SIZE);
  //       y = Math.floor(Math.random() * GRID_SIZE);
  //       value = 2 ** (Math.floor(Math.random() * VALUE_COUNT) + VALUE_COUNT_OFF); // Generates values: 2, 4, 8, 16, 32
  //     } while (
  //       snake.some((s) => s.x === x && s.y === y) ||
  //       newFood.some((f) => f.x === x && f.y === y)
  //     );

  //     newFood[index] = { x, y, value }; // Replace only the eaten food item
  //     return newFood;
  //   });
  // };
  // const changeDirection = (): void => {
  //   const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  //   let newDirection: Direction;
  //   const head = snake[0]; // Current snake head position

  //   do {
  //     newDirection = directions[Math.floor(Math.random() * directions.length)];
  //   } while (
  //     (newDirection === "UP" && direction === "DOWN") ||
  //     (newDirection === "DOWN" && direction === "UP") ||
  //     (newDirection === "LEFT" && direction === "RIGHT") ||
  //     (newDirection === "RIGHT" && direction === "LEFT") ||
  //     (head.x === 0 && newDirection === "LEFT") || // Avoid left wall
  //     (head.x === GRID_SIZE - 1 && newDirection === "RIGHT") || // Avoid right wall
  //     (head.y === 0 && newDirection === "UP") || // Avoid top wall
  //     (head.y === GRID_SIZE - 1 && newDirection === "DOWN") // Avoid bottom wall
  //   );

  //   setDirection(newDirection);
  // };