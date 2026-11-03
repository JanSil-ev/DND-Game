export function rollDice(sides: number): number {
    if(!Number.isInteger(sides) || sides <= 2) {
        throw new Error("количество граней должно быть целым числом больше 2");
    }
    return Math.floor(Math.random() * sides) + 1;
}
