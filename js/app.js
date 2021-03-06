let botonEnviar = document.getElementById("btnGuardar");
let botonLimpiar = document.getElementById("btnLimpiar");
let selectFiltro = document.getElementById("selectFiltro");

botonEnviar.addEventListener("click", enviarAnuncio, false);
botonEnviar.addEventListener("click", eliminarAnuncio, false);

botonLimpiar.addEventListener("click", limpiarForm, false);

selectFiltro.addEventListener("change", filtrarTabla);

setTimeout(() => { administrarTabla() }, (Math.random() * (3000 - 1000) + 1000));

async function administrarTabla() {

    var vehiculos;
    await getVehiculos().then((data) => {
        vehiculos = data;
        localStorage.setItem("vehiculos", JSON.stringify(vehiculos));
    }).catch(e => {
        alert(e.message)
        armarDivError()
        throw new Error(e.message);
    }).finally(() => {
        switchSpinner();
    })

    if (!vehiculos || vehiculos.length < 1) {
        armarDivError()
    } else {
        var colsOcultas = JSON.parse(localStorage.getItem("columnasOcultas"));
        if(colsOcultas != null && colsOcultas.length > 0){
            vehiculos.map((el) => { for (let campo in colsOcultas) { el[colsOcultas[campo]] = ""; } });
        }
        
        let tabla = armarTabla(vehiculos, "vehiculo", colsOcultas);//
        armarSeccionTabla(tabla, vehiculos)
        mostrarPromedioPrecios(vehiculos)
    }
}

function armarDivError() {
    let pTablaVacia = document.createElement("p");
    pTablaVacia.innerHTML = "No se encontraron Vehiculos";
    pTablaVacia.className = "mensajeTabla";
    document.getElementById("seccionTabla").insertBefore(pTablaVacia, document.getElementById("spinner"));
}

function armarSeccionTabla(tabla) {

    let p = document.createElement("p");
    p.innerHTML = "* Puede cargar el Formulario con datos de la tabla haciendo click en algun registro.";
    p.classList = "noselect"
    p.id = "ayudaTabla";

    let seccTabla = document.getElementById("seccionTabla");
    seccTabla.insertBefore(tabla, document.getElementById("spinner"));
    seccTabla.insertBefore(p, document.getElementById("spinner"));

    document.querySelectorAll("tr").forEach((el) => { el.addEventListener("click", mostrarEnFormulario, false) });

    let thFiltros = document.getElementsByClassName("thFiltro")
    Array.from(thFiltros).forEach((el) => {
        el.addEventListener("change", filtrarColumna)
    });
}

function switchSpinner() {

    let spinner = document.getElementById("spinner");
    if (spinner.hidden == false) {
        spinner.hidden = true;
    } else {
        spinner.hidden = false;
    }
}

function armarTabla(objs, nombreObjs, colFiltradas) {

    let dice = "odd";
    let tabla = document.createElement("table");
    tabla.id = "tabla_vehiculo";
    tabla.className = "table table-dark"
    let tbody = document.createElement("tbody");
    let thead = document.createElement("thead");

    let primeraVezIterando = true;

    objs.forEach((obj) => {
        delete obj.fechaAnuncio;

        let trProducto = document.createElement("tr");
        if (dice == "odd") {
            dice = "even";
            trProducto.className = "table-active";
        } else {
            dice = "odd";
        }
        trProducto.setAttribute("data-" + nombreObjs + "ID", obj.id);

        let trEncabezadoTabla = document.createElement("tr");
        Object.keys(obj).forEach((key) => {

            if (key.includes("id")) {
                return;
            }
            if (primeraVezIterando == true) {

                let thProducto = document.createElement("th");
                thead.className = "table-light";

                let nombreCol = key.replace(key[0], key[0].toUpperCase());
                let checkInput = "<input type='checkbox' checked id=th-" + key + " class='thFiltro'></input>";
                
                //console.log(colFiltradas);
                if (colFiltradas) {
                    colFiltradas.forEach(el => {
                        if (el == key) {
                            checkInput = "<input type='checkbox' id=th-" + key + " class='thFiltro'></input>";
                        }
                    })
                }

                thProducto.innerHTML = nombreCol + checkInput;

                trEncabezadoTabla.appendChild(thProducto)
            }

            let tdProducto = document.createElement("td");

            tdProducto.innerText = obj[key];

            trProducto.appendChild(tdProducto);

        })

        if (primeraVezIterando == true) {
            thead.appendChild(trEncabezadoTabla);
        }
        primeraVezIterando = false;
        tbody.appendChild(trProducto);

    })

    tabla.appendChild(thead);
    tabla.appendChild(tbody);
    //tabla.id = "tabla_" + nombreObjs;
    return tabla;
}

function refrescarTabla() {

    document.getElementById("propEliminar").value = "";
    let tabla = document.getElementById("tabla_vehiculo");

    if (tabla) {
        tabla.remove();
        document.getElementById("ayudaTabla").remove();
    }
    switchSpinner();
    setTimeout(() => { administrarTabla() }, (Math.random() * (3000 - 1000) + 1000));
}

function mostrarEnFormulario(e) {

    let idProdEliminar = e.srcElement.parentElement.dataset.vehiculoid;

    if (!idProdEliminar) {
        return null;
    }
    let inputHidden = document.getElementById("propEliminar");
    inputHidden.setAttribute("value", idProdEliminar);

    var campos = ['titulo', 'modalidad', 'descripcion', 'precio', 'puertas', 'kilometros', 'potencia'];
    e.srcElement.parentElement.childNodes.forEach((el, i) => {

        if (campos[i] == 'modalidad') {
            if (el.innerHTML == 'venta') {
                document.getElementById("venta").checked = true;
                document.getElementById("alquiler").checked = false;
            } else {
                document.getElementById("alquiler").checked = true;
                document.getElementById("venta").checked = false;
            }
        } else {
            document.getElementById(campos[i]).value = el.innerHTML;
        }

    });
}

async function eliminarAnuncio() {

    //La validacion no se si ponerla porque en realidad podria eliminar tranquilamente por ID
    if (document.getElementById("propEliminar").value == '' || !AdministrarValidaciones()) {
        return false;
    }

    let props = localStorage.getItem("vehiculos");
    let idEliminar = document.getElementById("propEliminar").value;
    if (props && idEliminar) {
        let vehiculos = JSON.parse(props).filter(el => el.id_vehiculo != idEliminar);

        await eliminarVehiculo(idEliminar).then(() => {

            localStorage.removeItem("vehiculos");
            if (vehiculos.length > 0) {
                localStorage.setItem("vehiculos", JSON.stringify(vehiculos));
            }
            document.getElementById("formularioBienesRaices").reset();
        }).catch(e => {
            alert(e.message)
            throw new Error(e.message);
        }).finally(() => {

            refrescarTabla();
        })
    }
}

function limpiarForm(e) {

    e.preventDefault();
    document.getElementById("formularioBienesRaices").reset()
    document.getElementById("propEliminar").value = "";
    let divErrores = document.getElementById("errorSection");
    if (divErrores) {
        document.getElementById("errorSection").remove();
    }
}

function filtrarVehiculos(veh) {

    let selectedOpt = document.getElementById("selectFiltro").value;
    if (selectedOpt != "todos") {
        veh = veh.filter(el => el.tipoVenta == selectedOpt)
    }
    return veh
}

function filtrarTabla(e) {

    let veh = localStorage.getItem("vehiculos");
   
    let columnasOcultas = getColumnasOcultas();
    
    let tablaExistente = document.getElementById("tabla_vehiculo");
    if (veh && tablaExistente != null) {
        veh = JSON.parse(veh);
        document.getElementById("tabla_vehiculo").remove();
        document.getElementById("ayudaTabla").remove();
        veh = filtrarVehiculos(veh);

        veh.map((el) => { for (let campo in columnasOcultas) { el[columnasOcultas[campo]] = ""; } });
        //Si borro con delete no aparecen los checks'

        let tabla = armarTabla(veh, "vehiculo", columnasOcultas);
        armarSeccionTabla(tabla)
        mostrarPromedioPrecios(veh)
        mostrarMaximoPrecio(veh);
        mostrarMinimoPrecio(veh);
        mostrarPromedioPotencia(veh);
    }

}

function filtrarColumna(e) {

    let veh = localStorage.getItem("vehiculos");
    
    let columnasOcultas = getColumnasOcultas();
    localStorage.setItem("columnasOcultas", JSON.stringify(columnasOcultas));

    let tablaExistente = document.getElementById("tabla_vehiculo");
    if (veh && tablaExistente != null) {

        veh = JSON.parse(veh);
        veh = filtrarVehiculos(veh);

        veh.map((el) => { for (let campo in columnasOcultas) { el[columnasOcultas[campo]] = ""; } });
        //Si borro con delete no aparecen los checks'

        document.getElementById("tabla_vehiculo").remove();
        document.getElementById("ayudaTabla").remove();

        
        let tabla = armarTabla(veh, "vehiculo", columnasOcultas);
        armarSeccionTabla(tabla)
    }
}

function getColumnasOcultas() {

    let thFiltros = document.getElementsByClassName("thFiltro")
    let columnasOcultas = [];

    Array.from(thFiltros).forEach((el) => {
        if (!el.checked) {
            columnasOcultas.push(el.id.substr(3))
        }
    });

    return columnasOcultas;
}

function mostrarPromedioPrecios(vehiculos) {

    let promedioPrecios = 0;
    if (selectFiltro.value != "todos") {
        promedioPrecios = Anuncio.getPromedioPrecio(vehiculos);
        promedioPrecios = promedioPrecios.toFixed(2);
    } else {
        promedioPrecios = "N/A";
    }
    let promeDIOS = document.getElementById("promedios");
    promeDIOS.innerText = "PROMEDIO DE PRECIOS: " + promedioPrecios;
}

function mostrarMaximoPrecio(vehiculos) {

    let cocheMaximoPrecio = vehiculos.reduce(function(anterior, actual) {
        return (anterior.precio > actual.precio) ? anterior : actual
    })
    
    let mayorPrecioDiv = document.getElementById("mayorPrecio");
    mayorPrecioDiv.innerText = "MAYOR PRECIO: " + cocheMaximoPrecio.precio;
      
}

function mostrarMinimoPrecio(vehiculos) {

    const cocheMenorPrecio = vehiculos.reduce(function(anterior, actual) {
        return (anterior.precio < actual.precio) ? anterior : actual
    })
    
    let menorPrecioDiv = document.getElementById("menorPrecio");
    menorPrecioDiv.innerText = "MENOR PRECIO: " + cocheMenorPrecio.precio;
      
}

function mostrarPromedioPotencia(vehiculos){

    let totalPotencia = vehiculos[0].potencia;
    let sumaTotalPotencia = vehiculos.reduce((anterior, cocheActual) => totalPotencia += cocheActual.potencia);
    let promedioPotencia = sumaTotalPotencia / vehiculos.length;

    let promedioPotenciaDiv = document.getElementById("promedioPotencia");
    promedioPotenciaDiv.innerText = "PROMEDIO POTENCIA: " + promedioPotencia.toFixed(2);
}