interface RequestBodyInterface{
    "part"?: PartDBEntry,
    "applications"?: Array<Application>,
    "start_year"?: number
}

class Part{
    make: string;
    oe_number: string;
    frey_number: string;
    price: number;
    image_url: string;

    constructor(make: string, oe_number: string, frey_number: string, price: number, image_url: string){
        this.make = make;
        this.oe_number = oe_number;
        this.frey_number = frey_number;
        this.price = price;
        this.image_url = image_url;
    }
}

class PartDBEntry extends Part{
    enabled: number;
    in_stock: number;
    description: string;
    brand: string;

    constructor(make: string, oe_number: string, frey_number: string, price: number, image_url: string, enabled: number, in_stock: number, brand: string){
        super(make, oe_number, frey_number, price, image_url);
        this.enabled = enabled;
        this.in_stock = in_stock;
        this.brand = brand;
    }
}

class Application{
    model: string;
    begin_year: number;
    end_year: number;
    
    constructor(model: string, begin_year: number, end_year: number){
        this.model = model;
        this.begin_year = begin_year;
        this.end_year = end_year;
    }
}
