declare module 'stopword' {
  export function removeStopwords(
    words: string[],
    language?: string[] | string
  ): string[];

  export const eng: string[];
  export const ita: string[];
  export const spa: string[];
  export const fra: string[];
  export const deu: string[];
}
