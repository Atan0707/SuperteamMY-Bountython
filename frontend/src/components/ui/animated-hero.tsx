import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Umbrella } from "lucide-react";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["art", "craft", "masterpiece", "meme", "photograph", "anything"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full text-white">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          {/* <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Read our launch article <MoveRight className="w-4 h-4" />
            </Button>
          </div> */}
          <div className="flex gap-4 flex-col">
            <h1 className="text-6xl md:text-8xl mb-4 tracking-tighter text-center font-bold text-white">
              PAYUNG <Umbrella className="inline-block w-16 h-16 md:w-20 md:h-20" />
            </h1>
            <h1 className="text-5xl md:text-5xl max-w-2xl tracking-tighter text-center font-regular text-white">
              <span className="text-white">Payung your</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-white"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-white max-w-2xl text-center">
              Payung anything you want to the world!
            </p>
          </div>
          {/* <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4">
              Payung now! <MoveRight className="w-4 h-4" />
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export { Hero };
