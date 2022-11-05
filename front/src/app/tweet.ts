import { Geo } from "./geo";

export interface Tweet {
    id: number;
    text: string;
    created_at: string;
    coordinates : Geo;
}
