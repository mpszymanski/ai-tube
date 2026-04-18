export function tagHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return h % 360;
}

export function tagStyle(name: string): { color: string; background: string; borderColor: string } {
  const hue = tagHue(name);
  return {
    color: `hsl(${hue}, 70%, 68%)`,
    background: `hsl(${hue}, 55%, 14%)`,
    borderColor: `hsl(${hue}, 55%, 28%)`,
  };
}
