const { io } = require('../server');

const { Usuarios } = require('../classes/usuarios');

const { crearMensaje } = require('../utils/utils')

const usuarios = new Usuarios();


io.on('connection', (client) => {

    client.on('entrarChat', (usuario, callback) => {
        if (!usuario.nombre || !usuario.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre es necesario'
            })
        }
        client.join(usuario.sala);
        usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala);
        client.broadcast.to(usuario.sala).emit('listaPersona', usuarios.getPersonasPorSala(usuario.sala));
        client.broadcast.to(usuario.sala).emit('crearMensaje', crearMensaje('administrador', `${usuario.nombre} se unió`));
        callback(usuarios.getPersonasPorSala(usuario.sala));
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('administrador', `${personaBorrada.nombre} salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
    });

    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
        callback(mensaje);
    });

    //Mensajes privador
    client.on('mensajePrivado', (data) => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('crearMensaje', crearMensaje(persona.nombre, data.mensaje));
    })
});