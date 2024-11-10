export interface Hut {
    id: number;
    name: string;
    type: string;
    description: string;
    free_seats: number;
    status: string;
    coordinates: [number, number]; // [x, y] pixel coordinates
    elevation: number;
}
