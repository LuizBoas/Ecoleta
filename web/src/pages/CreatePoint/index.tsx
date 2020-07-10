import React, { useEffect, useState, ChangeEvent, FormEvent} from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker} from 'react-leaflet';
import api from '../../service/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';

import logo from '../../assets/logo.svg';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface UfResponse {
    sigla : string;
}

interface CityResponse {
    nome : string;
}


const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number,number]>([0, 0]);

    const [formData, setFormData] = useState ({
        name : '',
        email: '',
        whatsapp : '',
    });

    const [selectUf, setSelectUf] = useState('0');
    const [selectCity, setSelectCity] = useState('0');
    const [selectItems, setSelectItems] = useState<number[]>([]);
    const [selectPosition, setSelectPosition] = useState<[number,number]>([0, 0]);

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const {longitude, latitude} = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, [])

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, [])

    useEffect(() => {
        axios.get<UfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla)  
            setUfs(ufInitials);
        })
    }, [])

    useEffect(() => {
        if (selectUf === "0"){
            return;
        }
        /* usa classes quando quiser colocar uma variável dentro do texto */
        axios
            .get<CityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectUf}/municipios`)
            .then(response => { 
            const cityNames = response.data.map(city => city.nome)  
            setCities(cityNames);
        })

    }, [selectUf]);// [] momento que a funçao deve executar
    

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){ //typescript rect cheat sheet
        const uf = event.target.value;
        setSelectUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){ //typescript rect cheat sheet
        const city = event.target.value;
        setSelectCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])

    }

    function handleInputChange (event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;

        setFormData({ ...formData, [name]: value})
    }

    function handleSelectItem (id : number) {
        const alreadySelect = selectItems.findIndex(item => item === id );

        if(alreadySelect >= 0){
            const filteredItems = selectItems.filter(item => item !== id);

            setSelectItems(filteredItems);
        } else {
            setSelectItems([ ...selectItems, id]);
        }
    }

    async function handleSubmit (event: FormEvent){
        event.preventDefault(); // para nao da reload

        const {name, email, whatsapp} = formData;
        const uf = selectUf;
        const city = selectCity;
        const [latitude, longitude] = selectPosition;
        const items = selectItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        };

        await api.post('points', data);

        alert('Ponto de coleta criado!');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/>ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="name">E-mail</label>
                            <input 
                                type="email" 
                                name="email" 
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="name">Whatsapp</label>
                            <input 
                                type="text" 
                                name="whatsapp" 
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Endereços</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer //designer do mapa
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectPosition}/>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                value={selectUf} 
                                onChange={handleSelectUf}
                            >
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key ={uf} value={uf}>{uf}</option>

                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city" 
                                value={selectCity} 
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key ={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectItems.includes(item.id)? 'select' : ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastra ponto de coleta
                </button>
                
            </form>
        </div>
    );
};

export default CreatePoint;