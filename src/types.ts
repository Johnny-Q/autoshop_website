interface Part{
    oe_number: string,
    price: number,
    image_url: string,
    interchangable_parts: string[],
    description: string
}

interface Application{
    model: string,
    begin_year: number,
    end_year: number
}

