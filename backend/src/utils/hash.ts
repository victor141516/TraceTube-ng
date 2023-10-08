export const getHash = (str: string): Promise<string> => {
  return Bun.password.hash(str)
}

export const verifyHash = (str: string, hash: string): Promise<boolean> => {
  return Bun.password.verify(str, hash)
}
