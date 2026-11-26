/** Species-specific natural ramps. UI colors remain unchanged. */
const ramps = {
  quiltro: ['#67402B', '#A66E3D', '#E5A35C', '#F3C47C', '#FFE5AE', '#287BA5'],
  quiltra: ['#252826', '#5E635A', '#C7C8B9', '#F5F0DC', '#FFFFFF', '#BC6557'],
  gato: ['#56382D', '#99633B', '#C38B4A', '#E1B66C', '#F6E8CC', '#78AA57'],
  pumaPj: ['#514235', '#877356', '#B39B72', '#D3BD8D', '#EBDBB5', '#BDA35A'],
  jaguar: ['#3E3026', '#977332', '#CDA347', '#E8C96C', '#F3E2B1', '#85A858'],
  pudu: ['#34261D', '#573425', '#814B2D', '#A96B3C', '#CFAB75', '#D79D57'],
  huemul: ['#3B322A', '#655641', '#8E7E61', '#B1A185', '#DDD1AF', '#8D693C'],
  guanacoPj: ['#473526', '#81583C', '#B68050', '#D3A26E', '#F1DFB9', '#413D34'],
  llamaPj: ['#625347', '#AB997E', '#D8CDB2', '#EEE7D2', '#FFF7DF', '#C35F74'],
  monito: ['#302A1E', '#544B34', '#847B56', '#AAA174', '#E5D8B0', '#C58A78'],
  chinchilla: ['#35434E', '#596C79', '#859AA6', '#AFBDC3', '#E4E9DF', '#C4979D'],
  vizcacha: ['#494236', '#726953', '#9B9277', '#BDB59A', '#E2D4AC', '#AE7C62'],
  chinguePj: ['#1C2525', '#293634', '#40504A', '#718175', '#ECEBD8', '#B5897C'],
  loboMarinoPj: ['#30231E', '#52372A', '#795035', '#A16E43', '#CD9A63', '#E0C79E'],
  pinguino: ['#17282E', '#263F46', '#3F5960', '#71888A', '#F4EFDC', '#BF827F'],
  condor: ['#292622', '#403A30', '#5D5341', '#86745C', '#E8DFBF', '#B9756C'],
  palomaRebelde: ['#263741', '#405966', '#64818D', '#91AAB1', '#D0D8CA', '#4EA39C'],
  flamenco: ['#853E43', '#B65D62', '#D98285', '#EEA9A3', '#F9D4BE', '#D34E5C'],
  carpintero: ['#1B2020', '#2C3432', '#444C47', '#707A70', '#E6E3C6', '#CE3E37'],
  tucan: ['#192321', '#29352F', '#465348', '#778366', '#F5D56C', '#DF8A35'],
  caleuchito: ['#234F68', '#397F99', '#66B7C7', '#9DDFE1', '#DAFFF0', '#89EED1'],
  pillan: ['#402B2D', '#7D3E2C', '#B75A2D', '#E48A36', '#FFCF64', '#F4B740'],
  dieciocho: ['#533326', '#8D5031', '#B77847', '#DCAB6E', '#F1D7A7', '#C15348'],
  trauco: ['#293B28', '#48613B', '#71844F', '#A1AC6C', '#D7CEA0', '#A77744'],
} as const;

const colors = new Map<string, string>();
function register(hex: string): string {
  let char = colors.get(hex);
  if (!char) { char = String.fromCharCode(0x400 + colors.size); colors.set(hex, char); }
  return char;
}
export interface Coat { ink: string; shadow: string; base: string; light: string; belly: string; accent: string }
export const COATS = Object.fromEntries(Object.entries(ramps).map(([id, ramp]) => {
  const [ink, shadow, base, light, belly, accent] = ramp.map(register) as [string, string, string, string, string, string];
  return [id, { ink, shadow, base, light, belly, accent }];
})) as Record<keyof typeof ramps, Coat>;
export const CAST_PALETTE = [...colors].map(([hex, char], i) => ({ char, hex, name: `Elenco ${i + 1}`, use: 'Pelaje y plumaje de personajes' }));
