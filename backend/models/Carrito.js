/**
     * hooks acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoria
         * verifica que la categoria padre este activa
         */
        beforeCreate: async (subcategoria, options) => {
            const categoria = require('./categoria');

            //buscar categoria padre
            const categoria = await categoria.findByPk(subcategoria.categoriaId);
            if (!categoria) {
                throw new Error('la categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('no se puede crear una subcategoria en una categoria inactiva');
            }
        },

        /**
         * afterUpdate - se ejecuta despues de actualizar una categoria
         * si se desactiva una subcategoria se desactivan todos todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            //verificar si el campo activo se cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`desactivando categoria: ${subcategoria.nombre}`);

                //importar modelos (aqui para evitar dependencias circulares
                const producto = require('./Producto');

                try {
                    //paso 1 : desactivar los productos de esta subcategoria
                    const productos = await productos.findAll({
                        where: { subcategoriaId: subcategoria.id }
                    });

                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`subcategoria y productos relacionados desactivados correctamente`);
                } catch (error) {
                    console.error(`error al desactivar productos relacionados:`, error.message);
                    throw error;
                }
            }

            //si se activa una categoria, no se activan automaticamente las subcategorias y productos
        }
    }
});

//metodo de instancia
/**
 * metodo para contar productos de esta subcategoria
 *
 * @return {Promise<number>} numero de productos
 */
subcategoria.prototype.contarproductos = async function () {
    const producto = require('./Producto');
    return await producto.count({ where: { subcategoriaId: this.id } });
};