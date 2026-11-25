// @types/react has no MathML intrinsic elements yet, so declare the ones this deck uses.
// React renders them as plain DOM elements; browsers display MathML natively.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type MathMLProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  display?: 'block' | 'inline';
  mathvariant?: string;
  accent?: boolean | 'true' | 'false';
  accentunder?: boolean | 'true' | 'false';
  stretchy?: boolean | 'true' | 'false';
  columnalign?: string;
  [attr: string]: unknown;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mi: MathMLProps;
      mn: MathMLProps;
      mo: MathMLProps;
      mrow: MathMLProps;
      mfrac: MathMLProps;
      msub: MathMLProps;
      msup: MathMLProps;
      msubsup: MathMLProps;
      mover: MathMLProps;
      munder: MathMLProps;
      munderover: MathMLProps;
      mtable: MathMLProps;
      mtr: MathMLProps;
      mtd: MathMLProps;
      mtext: MathMLProps;
      mspace: MathMLProps;
      msqrt: MathMLProps;
    }
  }
}
