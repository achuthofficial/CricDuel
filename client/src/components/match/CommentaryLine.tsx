import { AnimatePresence, motion } from 'framer-motion';

interface CommentaryLineProps {
  text: string;
  isWicket: boolean;
}

export function CommentaryLine({ text, isWicket }: CommentaryLineProps) {
  return (
    <div className="h-6 overflow-hidden text-center" aria-live={isWicket ? 'assertive' : 'polite'}>
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="text-sm font-medium text-ledger/90"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
