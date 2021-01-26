//@ts-expect-error
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true // so we can avoid sqlite specific bugs
});
db.raw('PRAGMA foreign_keys = ON');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * @desc get specified number of parts with offset for pagination
 * @param {string} make the make of the part, null if match all
 * @param {string} model the model of the part, null if match all
 * @param {number} year the year of the part, null if match all
 * @param {string} engine the engine size, null if match all
 * @param {number} offset the number of parts to offset by
 * @param {number} num_results number of results to return
 */
async function paginatedSearch(make: string, model: string, year: number, engine: string, offset = 0, num_results = 1000, logged_in = false) { // refactored
    try {
        let columns = ['Parts.id', 'Parts.make', 'oe_number', 'description', 'frey_number'];
        if (logged_in) columns.push("price");

        return db('Parts').distinct(...columns).leftJoin("Applications", 'Applications.parts_id', "Parts.id")
            .whereRaw("IFNULL(? , Parts.make) like Parts.make", make)
            .andWhereRaw("IFNULL(? , model) like model", model)
            .andWhereRaw("IFNULL(? , begin_year) between begin_year and end_year", year)
            .leftJoin("Engines", "Engines.parts_id", "Parts.id")
            .andWhereRaw("IFNULL(?, IFNULL(engine, 'nullengine')) like IFNULL(engine, 'nullengine')", engine)
            .orderBy('Parts.description')
    } catch (err) {
        console.log(err);
        throw (err);
    }
}

async function getPartByIdNumber(id_number: string, logged_in = false): Promise<Array<PartDBEntry>> { // refactored
    id_number += '%'
    try {
        let columns = ['Parts.id', 'make', 'oe_number', 'description', 'frey_number'];
        if (logged_in) columns.push("price");
        return db.distinct(...columns).from('Parts')
            .leftJoin('Interchange', 'Parts.id', 'Interchange.parts_id')
            .whereRaw('Parts.oe_number like ?', id_number)
            .orWhereRaw('Parts.frey_number like ?', id_number)
            .orWhereRaw('int_number like ?', id_number)
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getPartByDbId(id: string) { // refactored
    try {
        let part = await db("Parts")
            .leftJoin('Interchange', "Parts.id", "Interchange.parts_id")
            .where('Parts.id', id)

        if (part.length > 0) return part[0]
        else return null;
    } catch (err) {
        console.log(err);
    }
}

/**
 * @desc obtains an array of distinct make names from database
 * @return {Promise<Array<string>>} a Promise of a string array
 * @todo sort returned array alphabetically but also by ascending number (aaa10 < aaa2 but aaa10 should come after aaa2)
 */
async function getMakes(): Promise<Array<string>> { // refactored
    return db('Parts').distinct('make').orderBy("make", "asc");
}
/**
 * @desc obtains array of valid years given a make
 * @return {Promise<Array<number>>} Promise of number array containing years
 * @param {string} make the make to query valid years for, null if match all
 */
async function getYears(make: string) { // refactored
    let begin_year = await db('Applications').whereRaw("IFNULL(?, make) like make", make).min('begin_year as begin_year');
    let end_year = await db('Applications').whereRaw("IFNUll(?, make) like make", make).max('end_year as end_year');
    return { "begin_year": begin_year[0].begin_year, "end_year": end_year[0].end_year }
}


/**
 * @desc obtains array of valid models given a make and year
 * @return {Promise<Array<string>>} Promise of string array containing models
 * @param {string} make the make to query valid models for, null if match all
 * @param {number} year the year to query valid models for, null if match all
 */
async function getModels(make: string, year: number): Promise<Array<string>> { // refactored
    return db.distinct('model').from('Applications')
        .whereRaw('IFNULL(? ,make) like make', make)
        .andWhereRaw('IFNULL(?, begin_year) between begin_year and end_year', year)
        .orderBy('model');
}

/**
 * @desc obtains array of valid engines given a make, year, and model
 * @return {Promise<Array<string>>} Promise of string array containing engine sizes
 * @param {string} make the make to query valid models for, null if match all
 * @param {number} year the year to query valid models for, null if match all
 */
async function getEngines(make: string, year: number, model: string): Promise<Array<string>> { // refactored
    return db('Engines').distinct('engine').leftJoin('Applications', "Engines.app_id", "Applications.id")
        .whereRaw('IFNULL(? ,make) like make', make)
        .andWhereRaw('IFNULL(?, begin_year) between begin_year and end_year', year)
        .andWhereRaw('IFNULL(?, model) like model', model)
        //.orderBy('engine');
}

async function getApps(part_id: string) { // refactored
    return db("Applications").where('parts_id', part_id);
}

/**
 * @param {Part} part object of type PartDBEntry with entry data stored inside
 * @param {Array<Application>} applications array of applications of the part with entry data stored inside
 * @desc takes a part and array of applications for that part and inserts into database
 * @return {Promise<number>} the id of inserted part in database
 */
async function addPart(part: Part, applications: Array<Application>, interchange = []): Promise<number> { // refactored
    for (let [key, value] of Object.entries(part)) {
        if (typeof (value) == "string") {
            if(key=="description") continue;
            part[key] = value.toLowerCase();
        }
    }
    // check if oe_number already exists
    let parts = await db('Parts').select('id').where('oe_number', part.oe_number);
    let part_id = null;
    let app_id = null;
    //clear every entry for the previous part if existed
    if (parts.length > 0) {
        part_id = parts[0].id;

        for (let i = 0; i < parts.length; i++) {
            await deletePart(parts[i].id);
        }
        // console.log('insert with delete', parts.length));
        // console.log(part);
        await db("Parts").insert({ ...part, id: part_id })
    }
    else { // otherwise just insert the part and store autoincremented part id
        // console.log("insert without delete");
        part_id = await db("Parts").insert(part);
    }

    // insert applications and engines
    for (let i = 0; i < applications.length; i++) {
        let { model, begin_year, end_year, engines } = applications[i];
        // insert application and store app_id for engine
        app_id = await db("Applications").insert({
            model,
            begin_year,
            end_year,
            make: part.make,
            parts_id: part_id
        })
        
        // if(engines && engines.length > 0) console.log(engines);
        for (let j = 0; j < engines.length; j++) {
            await db("Engines").insert({
                engine: engines[j],
                parts_id: part_id,
                app_id
            })
        }
    }

    for (let i = 0; i < interchange.length; i++) {
        await db('Interchange').insert({
            parts_id: part_id,
            app_id,
            int_number: interchange[i]
        });
    }

    return part_id
}

async function deletePart(part_id: string) { // refactored
    // delete all matching parts (for some reason if there are more than one part with OE num)
    await db("Parts").where('id', part_id).del()

    // delete all YearModel, Interchange, Engine entries
    await db("Applications").where('parts_id', part_id).del()
    await db("Interchange").where('parts_id', part_id).del()
    return db("Engines").where('parts_id', part_id).del()
}

/**
 * @desc register a user with given username, password, and additional info
 * @param {string} user desired registration username
 * @return {Promise<Array<string>>} array of error messages, if exists
 */
async function register(email, username, pass, additional_info) { // refactored
    let res = {
        email_token: null,
        errmsgs: []
    };
    // check if email already exists
    let user_count = await db('Accounts')
                        .where('email', email)
                        .orWhere('username', email)
                        .count('email', { as: 'count' });
    if (user_count[0].count > 0) {
        res.errmsgs.push('That email already exists');
    }

    // check if username already exists
    if(username){
        user_count = await db('Accounts')
                            .where('email', username)
                            .orWhere('username', username)
                            .count('username', { as: 'count' });
        if (user_count[0].count > 0) {
            res.errmsgs.push('That username already exists');
        }
    }
    // check if there has been error pushed already
    if(res.errmsgs.length > 0){
        // on error logic here
    }
    else { // no errors up until this point, create password hash and insert user now
        let email_hashed = crypto.createHash('md5').update(email).digest("hex");
        let email_token = email_hashed + randString(15);
        res.email_token = email_token;
        bcrypt.hash(pass, 12).then(async hash => {
            let expiry_time = Date.now() + 7 * 24 * 60 * 60 * 1000;
            await db('Accounts').insert({
                email: email,
                username: username,
                hash: hash,
                email_token: email_token,
                email_expiry: expiry_time,
                ...additional_info
            });
        });
    }
    return res;
}

async function login(user, pass) { // refactored
    let errmsgs = [];
    let match = false;
    let user_entry = await db('Accounts').leftJoin('Admins', "Admins.account_id", "Accounts.id").select()
                        .where("email", user)
                        .orWhere('username', user);
    if (user_entry.length == 0) {
        errmsgs.push('Username or password incorrect.');
    } else {
        match = await bcrypt.compare(pass, user_entry[0].hash);
        if (!match) errmsgs.push('Username or password incorrect.');
    }
    return { match, errmsgs, user: user_entry[0] };
}

async function queryPassToken(token: string) { // refactored
    let res = await db('Accounts').where('pass_token', token);
    return res;
}

async function changePass(user: string, pass: string) { // refactored
    bcrypt.hash(pass, 12).then(async hash => {
        await db('Accounts').where('email', user).update({
            hash: hash,
            temp_pass: 0
        });
    });
}

async function verifyEmail(token: string) { // refactored
    let res = {
        errmsg: ""
    }
    let users = await db('Accounts').where('email_token', token);
    if (users.length == 0) {
        res.errmsg = "Token not found";
        return res;
    }
    else {
        await db('Accounts').where('email_token', token).update({
            email_token: null,
            verified_email: 1
        })
    }
    return res;
}

async function resetPassword(email: string) { // refactored
    let res = {
        user: null,
        pass_token: null,
        msg: 'A password recovery email has been sent!'
    };
    let user = await db('Accounts').where('email', email);
    if (user.length > 0) {
        // don't say that no email found if no users found
        res.user = user[0];
        let email_hashed = crypto.createHash('md5').update(email).digest("hex");
        let pass_token = email_hashed + randString(30);
        res.pass_token = pass_token;
        let expiry_time = Date.now() + 24 * 60 * 60 * 1000;
        await db('Accounts').where('email', email).update({
            pass_token: pass_token,
            pass_expiry: expiry_time
        })
    }
    return res;
}


async function approveUser(id: number, status: number) { // refactored
    return await db("Accounts").where('id', id).update({
        approved: status
    });
}

async function getUnapprovedUsers() { // refactored
    return await db("Accounts").where('approved', 0);
}

function randString(length) {
    let result = '';
    const charset = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
    const set_length = charset.length;
    for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * set_length)];
    }
    return result;
}

async function searchCategories(category: string){
    category = '%' + category + '%';
    return db('Parts').whereRaw('description like ?', category).orderBy('description', 'asc');
}

async function getInts(part_id: number){
    return db('Interchange').where('parts_id', part_id);
}

module.exports = {
    getPartByIdNumber,
    getPartByDbId,
    getModels,
    getYears,
    getMakes,
    getEngines,
    getApps,
    addPart,
    paginatedSearch,
    register,
    verifyEmail,
    login,
    changePass,
    resetPassword,
    getUnapprovedUsers,
    queryPassToken,
    approveUser,
    searchCategories,
    getInts
}