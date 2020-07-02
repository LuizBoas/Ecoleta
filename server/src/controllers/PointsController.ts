import knex from '../database/connection';
import { Request, Response } from 'express';


class PointsController {
    async index(request : Request, response: Response) {
        const { city, uf, items} = request.query;

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('point')
            .join('point_items', 'point.id', '=', 'point_items.point_id') // pegar da tabelas pointItems os que estao na igualdade
            .whereIn('point_items.item_id', parsedItems ) // whereIn = pelo menos um
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('point.*');

        return response.json(points);


    }
    async show(request : Request, response: Response) {
        const { id } = request.params; // const id = request.params.id; 
        
        const point = await knex('point').where('id', id).first(); // retornar o primeiro achado 

        if(!point){
            return response.status(400).json({ message: 'Point not found.'});
        }


        const items = await knex('item')
            .join('point_items', 'item.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('item.title');

        return response.json({point, items});

    }

    async create(request : Request, response: Response) {
        const {
            name, // const name = request.body.name;
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
    
        const trx = await knex.transaction(); // só executar o knex se todods os knex derem certo
        
        const point = {
            image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
            name, // = name: name, 
            email,
            whatsapp,
            latitude,
            longitude,
            city, 
            uf
        };

        const ids = await trx('point').insert(point);
    
        const point_id = ids[0];
    
        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id : point_id, // ids é o ponto criado, logo o primeiro elemanto do ponto é o id 
            };
        })
    
        await trx('point_items').insert(pointItems);

        await trx.commit();
    
        return response.json({
            id: point_id,
            ... point,    
        });
    };
}

export default PointsController;

