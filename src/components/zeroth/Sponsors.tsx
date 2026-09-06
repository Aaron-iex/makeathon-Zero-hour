import { motion } from "framer-motion";

const SPONSORS = [{ name: "Cooper Elevators", image: "/images/sponsors/image.png" }];

export function Sponsors() {
  return (
    <section id="sponsors" className="border-y border-border bg-card/10">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="font-mono-tech text-[11px] tracking-[0.25em] text-primary">
            // INDUSTRY CONNECT
          </span>
          <h2 className="mt-3 font-display text-2xl font-black uppercase sm:text-4xl">
            Powered by <span className="text-accent">our sponsors</span>
          </h2>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12">
          {SPONSORS.map((sponsor, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={`${sponsor.name}-${index}`}
              className="flex flex-col items-center gap-4"
            >
              <span className="font-mono-tech text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                // POWERED BY
              </span>
              <div className="group flex items-center justify-center transition-all duration-300 hover:scale-110 border-rotate-fast p-2">
                <img
                  src={sponsor.image}
                  alt={`${sponsor.name} logo`}
                  loading="lazy"
                  className="max-w-full h-20 sm:h-24 w-auto object-contain transition-all duration-300"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
