export const categoryMarquees = {
    CAFE: "Santa Bárbara, Antioquia - @cafe_lucus",
    PANADERIA: "Hecho con Versalles",
    REPOSTERIA: "Todo hecho por Proyecto Café",
    BEBIDAS: "Frutas: Plaza Minorista • Café: Santa Bárbara, Antioquia - Marta @cafe_lucus",
    DESAYUNO: "Estilo Americano < de las Americas >",
    TARDEO: "Masa madre:@lapanaderiamodou",
    DEFAULT: "En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados."
};

export const getCategoryMarquee = (category) => {
    return categoryMarquees[category] || categoryMarquees.DEFAULT;
};
