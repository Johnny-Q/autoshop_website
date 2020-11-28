const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true // so we can avoid sqlite specific bugs
});
function DBtoCSV() {
    console.log("asdf");
}

async function getParts(make: string, model: string, year: number): Promise<Array<any>> {
    try {
        return db.select().from('parts').whereRaw('make = IFNULL(?, make)', [make]).whereIn('id', function () {
            this.select('parts_id').from('year_model_connect').whereRaw('model = IFNULL(?, model)', [model]).whereRaw('IFNULL(?, begin_year) between begin_year and end_year', [year]);
        })
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function addPart(oe_number: string, frey_number: string, make: string, price: number, applications: Array<Application>) {
    try {
        let data = {
            'oe_number': oe_number,
            'frey_number': frey_number,
            'make': make,
            'price': price,
            'enabled': 1,
            'in_stock': 1
        }
        let part_id = await db('parts').insert(data, ['id']);
        applications.forEach(async (app)=>{
            let temp: any = app;
            temp.parts_id = part_id;
            try{
                await db('year_model_connect').insert(temp);
            }catch(err){
                console.log(err);
            }
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function updatePart() { }

async function getByYear(query) {
    try {
        return db.select().from('parts').whereIn('id', function () {
            this.select('parts_id').from('year_model_connect').whereRaw('? between begin_year and end_year', [query]);
        })
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    DBtoCSV,
    getByYear,
    getParts,
    addPart
}