export const customAlphabet = (alphabet: string, size: number) => {
  return () => {
    let id = '';
    for (let i = 0; i < size; i++) {
      id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return id;
  };
};

export const nanoid = (size = 21) => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return id;
};
