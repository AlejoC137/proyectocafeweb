export const categoryMarquees = {
    CAFE: "Café: Santa Bárbara, Antioquia - Marta @cafe_lucus",
    PANADERIA: "Hecho con Versalles",
    REPOSTERIA: "Pan de masa madre: Carlos - @lapanaderiamodou",
    BEBIDAS: "Frutas: Plaza Minorista • Café: Santa Bárbara, Antioquia - Marta @cafe_lucus",
    DESAYUNO: "Estilo Americano < de las Americas >",
    TARDEO: "masa madre:@lapanaderiamodou",
    DEFAULT: "En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados."
};

export const getCategoryMarquee = (category) => {
    return categoryMarquees[category] || categoryMarquees.DEFAULT;
};
