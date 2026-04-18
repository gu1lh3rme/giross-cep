export interface CepData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  latitude: number;
  longitude: number;
}

export interface CepSearchResult {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  latitude?: number;
  longitude?: number;
  distanciaKm: number;
}
