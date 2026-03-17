import React from 'react';

export function CardGridPrintInline({ products, isEnglish, GRUPO, SUB_GRUPO, TITTLE }) {

    const filteredProducts = products.filter((product) => {
        const groupMatch = Array.isArray(GRUPO)
            ? GRUPO.includes(product.GRUPO)
            : product.GRUPO === GRUPO;

        return (
            groupMatch &&
            product.Estado === "Activo" &&
            (!SUB_GRUPO || product.SUB_GRUPO === SUB_GRUPO)
        );
    });

    if (filteredProducts.filter(p => p.PRINT === true).length === 0) {
        return null;
    }

    const formatPrice = (precio) => {
        if (precio >= 1000) {
            return `${precio / 1000} K`;
        }
        return precio;
    };

    const titleText = TITTLE ? TITTLE[isEnglish ? "EN" : "ES"] : String(GRUPO);

    return (
        <>
            <span className="font-black text-sm uppercase tracking-wide mr-2 bg-black text-white px-2 py-0.5 border-[2px] border-black inline-block align-baseline mb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] print:shadow-none">
                {titleText}
            </span>
            <span className="font-light text-sm leading-snug">
                {filteredProducts
                    .filter((product) => product.PRINT === true)
                    .sort((a, b) => Number(a.Order) - Number(b.Order))
                    .map((product, index, array) => {
                        const description = isEnglish ? product.DescripcionMenuEN : product.DescripcionMenuES;
                        return (
                            <React.Fragment key={product._id}>
                                <span className="font-SpaceGrotesk font-black uppercase text-black">
                                    {isEnglish ? product.NombreEN : product.NombreES}
                                </span>
                                <span className="ml-1 font-SpaceGrotesk font-black text-black border-l-[2px] border-black pl-1 leading-none align-baseline">
                                    ${formatPrice(product.Precio)}
                                </span>
                                {description && (
                                    <span className="ml-1 text-gray-800 text-[11px] italic font-medium align-baseline tracking-tight">
                                        {description}
                                    </span>
                                )}
                                {index < array.length - 1 && (
                                    <span className="mx-2 font-black text-black align-baseline"> • </span>
                                )}
                            </React.Fragment>
                        );
                    })}
            </span>
        </>
    );
}
