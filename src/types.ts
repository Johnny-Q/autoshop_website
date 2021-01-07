interface Part{
    id?: number,
    oe_number: string,
    frey_number: string,
    make: string,
    brand: string,
    price: number,
    enabled: boolean,
    instock?: boolean,
    description: string,
    applications?:Array<Application>,
    int_numbers?: string[]
}

interface Application{
    id?: number,
    model: string,
    begin_year: number,
    end_year: number,
    parts_id?: number,
    make?: string
    engines?: Array<Engine>
}

interface Engine{
    id?: number,
    engine: string,
    app_id?: number,
    parts_id?: number
}