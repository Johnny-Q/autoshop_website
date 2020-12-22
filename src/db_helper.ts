//@ts-expect-error
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true // so we can avoid sqlite specific bugs
});

const bcrypt = require('bcrypt');
function DBtoCSV() {
    console.log("asdf");
}

/**
 * 
 * @param {string} make the make of the part, null if match all
 * @param {string} model the model of the part, null if match all
 * @param {number} year the year of the part, null if match all
 * @param {string} engine the engine size, null if match all
 * @description searches database for all parts with applications matching query parameters
 * @return {Promise} Promise which resolves to array of PartInterface which match query parameters
 */
async function getPartsEngine(make: string, model: string, year: number, engine: string): Promise<Array<PartDBEntry>> {
    /* 
    select * from parts where make like 'bmw' and id in (
    select DISTINCT YearModel.parts_id from (YearModel left join Engines on YearModel.id = Engines.model_id) where 
        IFNULL(?, YearModel.begin_year) between YearModel.begin_year and YearModel.end_year and
        IFNULL(?, YearModel.model) like YearModel.model AND
        IFNULL(?, IFNULL(Engines.engine_size, 'null_model')) like IFNULL(Engines.engine_size, IFNULL(?, 'null_model'))
    )
    */
    try {
        // if(make) make = '%'+make+'%';
        // if(model) model = '%'+model+'%';
        // if(engine) engine = '%'+engine+'%';
        return db.select().from('Parts').leftJoin('Makes', 'Parts.make_id', 'Makes.id')
            .whereRaw('Makes.make like IFNULL(?, Makes.make)', [make]).whereIn('Parts.id', function () {
                this.distinct('YearModel.parts_id').from('YearModel')
                    .leftJoin('Engines', 'YearModel.id', 'Engines.model_id')
                    .leftJoin('Models', 'YearModel.model_id', 'Models.id')
                    .whereRaw('YearModel.year = IFNULL(?, YearModel.year)', [year])
                    .andWhereRaw('IFNULL(?, Models.model) like Models.model', [model])
                    .andWhereRaw("IFNULL(?, IFNULL(Engines.engine, 'null_engine')) like IFNULL(Engines.engine, IFNULL(?, 'null_engine'))", [engine, engine])
            });
    } catch (err) {
        console.log(err);
        throw (err);
    }
}

/**
 * @desc get specified number of parts with offset for pagination
 * @param {string} make the make of the part, null if match all
 * @param {string} model the model of the part, null if match all
 * @param {number} year the year of the part, null if match all
 * @param {string} engine the engine size, null if match all
 * @param {number} offset the number of parts to offset by
 * @param {number} num_results number of results to return
 */
async function paginatedSearch(make: string, model: string, year: number, engine: string, offset = 0, num_results = 10, logged_in = false) {
    try {
        // if(make) make = '%'+make+'%';
        // if(model) model = '%'+model+'%';
        // if(engine) engine = '%'+engine+'%';
        let columns = ['Parts.id', 'make', 'oe_number', 'description', 'image_url', 'frey_number', 'in_stock'];
        if (logged_in) columns.push("price");

        return db.select(...columns)
            .from('Parts').leftJoin('Makes', 'Parts.make_id', 'Makes.id')
            .whereRaw('Makes.make like IFNULL(?, Makes.make)', [make]).whereIn('Parts.id', function () {
                this.distinct('YearModel.parts_id').from('YearModel')
                    .leftJoin('Engines', 'YearModel.id', 'Engines.model_id')
                    .leftJoin('Models', 'YearModel.model_id', 'Models.id')
                    .whereRaw('YearModel.year = IFNULL(?, YearModel.year)', [year])
                    .andWhereRaw('IFNULL(?, Models.model) like Models.model', [model])
                    .andWhereRaw("IFNULL(?, IFNULL(Engines.engine, 'null_engine')) like IFNULL(Engines.engine, IFNULL(?, 'null_engine'))", [engine, engine])
            }).orderBy('Parts.id').limit(num_results).offset(offset);
    } catch (err) {
        console.log(err);
        throw (err);
    }
}

async function getPartByOEorFrey(id_number: string, logged_in = false): Promise<Array<PartDBEntry>> {
    try {
        let columns = ['Parts.id', 'make', 'oe_number', 'description', 'image_url', 'frey_number', 'in_stock'];
        if (logged_in) columns.push("price");
        return db.select(...columns).from('Parts').leftJoin('Makes', "Makes.id", "Parts.make_id")
            .whereRaw('oe_number like ?', id_number + '%').orWhereRaw('frey_number like ?', id_number + '%');
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * @desc obtains an array of distinct make names from database
 * @return {Promise<Array<string>>} a Promise of a string array
 * @todo sort returned array alphabetically but also by ascending number (aaa10 < aaa2 but aaa10 should come after aaa2)
 */
async function getMakes(): Promise<Array<string>> {
    try {
        return db('Makes').distinct('make');
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * @desc obtains array of valid years given a make
 * @return {Promise<Array<number>>} Promise of number array containing years
 * @param {string} make the make to query valid years for, null if match all
 */
async function getYears(make: string): Promise<Array<number>> {
    try {
        if (make == null) {
            return db('YearModel').distinct('year').orderBy('year');
        }
        let make_id = await db('Makes').select('id').where('make', make.toLowerCase());
        if (make_id.length == 0) return [];
        return db('YearModel').distinct('year').where('make_id', make_id[0].id).orderBy('year');
    } catch (err) {
        console.log(err);;
        throw err;
    }
}


/**
 * @desc obtains array of valid models given a make and year
 * @return {Promise<Array<string>>} Promise of string array containing models
 * @param {string} make the make to query valid models for, null if match all
 * @param {number} year the year to query valid models for, null if match all
 */
async function getModels(make: string, year: number): Promise<Array<string>> {
    try {
        if (make == null) {
            return db.distinct('model').from('YearModel').leftJoin('Models', 'Models.id', 'YearModel.model_id')
                .whereRaw('year = IFNULL(?, year)', year)
                .orderBy('model');
        }
        let make_id = await db('Makes').select('id').where('make', make.toLowerCase());
        if (make_id.length == 0) {
            return [];
        } else make_id = make_id[0].id;
        return db.distinct('model').from('YearModel').leftJoin('Models', 'Models.id', 'YearModel.model_id')
            .where('YearModel.make_id', make_id)
            .andWhereRaw('year = IFNULL(?, year)', year)
            .orderBy('model');
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * @desc obtains array of valid engines given a make, year, and model
 * @return {Promise<Array<string>>} Promise of string array containing engine sizes
 * @param {string} make the make to query valid models for, null if match all
 * @param {number} year the year to query valid models for, null if match all
 */
async function getEngines(make: string, year: number, model: string): Promise<Array<string>> {
    try {
        if (make == null) {
            return db.distinct('engine').from('YearModel').leftJoin('Models', 'Models.id', 'YearModel.model_id')
                .leftJoin('Engines', 'Engines.model_id', 'YearModel.id')
                .whereRaw('year = IFNULL(?, year)', year)
                .andWhereRaw('IFNULL(?, model) like model', model)
                .orderBy('engine');
        }
        let make_id = await db('Makes').select('id').where('make', make.toLowerCase());
        if (make_id.length == 0) {
            return [];
        } else make_id = make_id[0].id;
        return db.distinct('engine').from('YearModel').leftJoin('Models', 'Models.id', 'YearModel.model_id')
            .leftJoin('Engines', 'Engines.model_id', 'YearModel.id')
            .whereRaw('year = IFNULL(?, year)', year)
            .andWhereRaw('IFNULL(?, model) like model', model)
            .andWhere('YearModel.make_id', make_id)
            .orderBy('engine');
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getApps(part_id: string) {
    try {
        let models = await db('YearModel').leftJoin('Models', "YearModel.model_id", "Models.id").distinct('model').where('parts_id', part_id);
        let apps = [];
        for (let i = 0; i < models.length; i++) {
            let model = models[i];
            let years = await db("YearModel").leftJoin("Models", "YearModel.model_id", "Models.id")
                .select('year').where('model', model.model)
                .min('year as begin_year')
                .max('year as end_year');
            console.log(years)
            apps.push({
                model: model.model,
                begin_year: years[0].begin_year,
                end_year: years[0].end_year
            });
        };
        return apps;
    } catch (err) {

    }
}

/**
 * @param {PartDBEntry} part object of type PartDBEntry with entry data stored inside
 * @param {Array<Application>} applications array of applications of the part with entry data stored inside
 * @desc takes a part and array of applications for that part and inserts into database
 * @return {Promise<number>} the id of inserted part in database
 */
async function addPart(part_raw: PartDBEntry, applications: Array<Application>): Promise<number> {
    try {
        let make_id = await db('Makes').select('id').where('make', part_raw.make.toLowerCase());
        if (make_id.length == 0) {
            make_id = await db('Makes').insert({ 'make': part_raw.make.toLowerCase() });
        }
        else make_id = make_id[0].id;
        let brand_id = [{ id: null }];
        if (part_raw.brand) {
            brand_id = await db('Brands').select('id').where('brand', part_raw.brand.toLowerCase());
            if (brand_id.length == 0) {
                brand_id = await db('Brands').insert({ 'brand': part_raw.brand.toLowerCase() });
            }
            else brand_id = brand_id[0].id;
        }
        let part = part_raw as any;
        delete part.make; part.make_id = make_id;
        delete part.brand; part.brand_id = brand_id;
        let part_id = (await db('Parts').insert(part));
        for (let i = 0; i < applications.length; i++) {
            let app_raw = applications[i];
            let model_id = await db('Models').select('id').where('model', app_raw.model.toLowerCase()).andWhere('make_id', part.make_id);
            let ym_id;
            if (model_id.length == 0) {
                model_id = await db('Models').insert({
                    'model': app_raw.model.toLowerCase(),
                    'make_id': part.make_id
                });
            } else model_id = model_id[0].id;
            try {
                for (var year = app_raw.begin_year; year <= app_raw.end_year; year++) {
                    //console.log(make_id, model_id, part_id, year)
                    ym_id = await db('YearModel').insert({ 'make_id': make_id, 'model_id': model_id, 'parts_id': part_id, 'year': year });
                }
            } catch (err) {
                // console.log(err);
            }
            app_raw.engines.forEach(async engine => {
                await db('Engines').insert({ "engine": engine, "model_id": model_id });
            });
        }
        return part_id;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * @desc register a user with given username, password, and additional info
 * @param {string} user desired registration username
 * @return {Promise<Array<string>>} array of error messages, if exists
 */
async function register(user, pass, additional_info) {
    let errmsgs = [];
    // check if user already exists
    let user_count = await db('Accounts').where('user', user).count('user', { as: 'count' });
    console.log(user_count);
    if (user_count[0].count > 0) {
        errmsgs.push('that username already exists');
    }
    else {
        bcrypt.hash(pass, 12).then(async hash => {
            await db('Accounts').insert({
                user: user,
                hash: hash
            });
        });
    }

    return errmsgs;
}

async function login(user, pass) {
    let errmsgs = [];
    let match = false;
    let user_entry = await db('Accounts').select('hash', 'id').where("user", user);
    let user_id = -1;
    if (user_entry.length == 0) {
        errmsgs.push('Username or password incorrect.');
    } else {
        match = await bcrypt.compare(pass, user_entry[0].hash);
        if (!match) errmsgs.push('Username or password incorrect.');
        else {
            user_id = user_entry[0].id;
        }
    }
    return { match, errmsgs, user_id };
}



async function updatePart() { }

module.exports = {
    DBtoCSV,
    getPartByOEorFrey,
    getPartsEngine,
    getModels,
    getYears,
    getMakes,
    getEngines,
    getApps,
    addPart,
    paginatedSearch,
    register,
    login
}