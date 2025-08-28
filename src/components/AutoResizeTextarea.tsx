import React, { useEffect, useRef } from 'react';
import { Textarea, TextareaProps } from "@/components/ui/textarea";

interface AutoResizeTextareaProps extends TextareaProps {
  value: string;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ value, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height to recalculate
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [value]);

    return (
      <Textarea
        {...props}
        ref={(el) => {
          // Assign both refs
          if (textareaRef) {
            (textareaRef as React.MutableRefObject<HTMLTextAreaElement>).current = el;
          }
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLTextAreaElement>).current = el;
          }
        }}
        value={value}
        className="overflow-hidden" // Hide scrollbar
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default AutoResizeTextarea;
