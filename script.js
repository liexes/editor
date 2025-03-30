let selectedShape = null;
let offsetX = 0;
let offsetY = 0;
let isResizing = false;

function createBox() {
    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;
    const container = document.getElementById('container');
    
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.innerHTML = ''; // Limpiar el contenedor de formas
    document.querySelector('.layer-items').innerHTML = ''; // Limpiar las capas
}

function addShape() {
    const shapeType = document.querySelector('input[name="radio"]:checked').value;
    const shapeWidth = document.getElementById('shapeWidth').value;
    const shapeHeight = document.getElementById('shapeHeight').value;
    const container = document.getElementById('container');
    const layerItems = document.querySelector('.layer-items');
    
    const shape = document.createElement('div');
    shape.classList.add('shape', shapeType);
    shape.style.width = `${shapeWidth}px`;
    shape.style.height = `${shapeHeight}px`;
    shape.style.left = `0px`;
    shape.style.top = `0px`;
    shape.dataset.id = `shape-${Date.now()}`;
    
    if (shapeType === 'triangle') {
        shape.style.borderLeft = `${shapeWidth / 2}px solid transparent`;
        shape.style.borderRight = `${shapeWidth / 2}px solid transparent`;
        shape.style.borderBottom = `${shapeHeight}px solid green`;
        shape.style.width = 0;
        shape.style.height = 0;
    } else if (shapeType === 'text') {
        const defaultText = 'Texto de ejemplo';
        shape.textContent = defaultText;
        shape.style.display = 'flex';
        shape.style.alignItems = 'center';
        shape.style.justifyContent = 'center';
        shape.style.color = '#000';
        shape.style.overflow = 'hidden';
    }
    
    // Eventos para arrastrar
    shape.addEventListener('mousedown', handleMouseDown);
    
    // Evento para menú contextual
    shape.addEventListener('contextmenu', showContextMenu);
    
    container.appendChild(shape);
    
    const layerItem = document.createElement('div');
    layerItem.classList.add('layer-item');
    layerItem.textContent = `${shapeType} (${shapeWidth}x${shapeHeight})`;
    layerItem.dataset.id = shape.dataset.id;
    layerItem.addEventListener('click', () => selectShape(shape, layerItem));
    
    // Menú contextual para capas
    layerItem.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const shapeElement = document.querySelector(`.shape[data-id="${layerItem.dataset.id}"]`);
        if (shapeElement) {
            selectShape(shapeElement, layerItem);
            showContextMenu(event, shapeElement);
        }
    });
    
    layerItems.appendChild(layerItem);
    
    // Actualizar coordenadas y tamaño
    updateInfoPanel(shape);
}

function showContextMenu(event, targetShape = null) {
    event.preventDefault();
    
    // Eliminar menús existentes
    const existingMenu = document.getElementById('context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const shape = targetShape || event.currentTarget;
    
    // Seleccionar la forma
    const layerItem = document.querySelector(`.layer-item[data-id="${shape.dataset.id}"]`);
    selectShape(shape, layerItem);
    
    // Crear menú contextual
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.classList.add('context-menu');
    
    // Opciones del menú
    const options = [
        { text: 'Redimensionar', action: () => resizeShape() },
        { text: 'Eliminar', action: () => deleteShape() },
        { text: 'Duplicar', action: () => duplicateShape() }
    ];
    
    // Si es un elemento de texto, agregar opción para editar
    if (shape.classList.contains('text')) {
        options.unshift({ text: 'Editar texto', action: () => editText(shape) });
    }
    
    // Crear elementos del menú
    options.forEach(option => {
        const item = document.createElement('div');
        item.classList.add('menu-item');
        item.textContent = option.text;
        item.addEventListener('click', () => {
            option.action();
            menu.remove();
        });
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Cerrar el menú al hacer clic fuera de él
    function closeContextMenu(e) {
        if (!menu.contains(e.target) && e.target !== shape) {
            menu.remove();
            document.removeEventListener('click', closeContextMenu);
            document.removeEventListener('contextmenu', closeContextMenu);
        }
    }
    
    document.addEventListener('click', closeContextMenu);
    document.addEventListener('contextmenu', closeContextMenu);
}

function handleMouseDown(event) {
    // Ignorar clics del botón derecho aquí, ya que se manejan en showContextMenu
    if (event.button === 2) return;
    
    // Prevenir múltiples eventos si ya está en resize
    if (isResizing) return;

    // Verificar si se hizo clic en un manejador de resize
    if (event.target.classList.contains('resize-handle')) {
        startResize(event);
        return;
    }

    // Iniciar arrastre
    const shape = event.currentTarget;
    selectShape(shape, document.querySelector(`.layer-item[data-id="${shape.dataset.id}"]`));
    
    // Calcular offset relativo al elemento
    const rect = shape.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    function moveShape(event) {
        const container = document.getElementById('container');
        const rect = container.getBoundingClientRect();
        let x = event.clientX - rect.left - offsetX;
        let y = event.clientY - rect.top - offsetY;

        // Restricciones de movimiento dentro del contenedor
        x = Math.max(0, Math.min(rect.width - shape.offsetWidth, x));
        y = Math.max(0, Math.min(rect.height - shape.offsetHeight, y));

        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;

        // Actualizar coordenadas y tamaño
        updateInfoPanel(shape);
    }

    function stopMoving() {
        document.removeEventListener('mousemove', moveShape);
        document.removeEventListener('mouseup', stopMoving);
    }

    document.addEventListener('mousemove', moveShape);
    document.addEventListener('mouseup', stopMoving);
}

function startResize(event) {
    const resizeHandle = event.target;
    const shape = resizeHandle.closest('.shape');
    const container = document.getElementById('container');
    const containerRect = container.getBoundingClientRect();

    isResizing = true;
    const direction = resizeHandle.dataset.direction;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = shape.offsetWidth;
    const startHeight = shape.offsetHeight;
    const startLeft = shape.offsetLeft;
    const startTop = shape.offsetTop;

    function resize(event) {
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        // Lógica de redimensionamiento para cada dirección
        switch(direction) {
            case 'top-left':
                newWidth = Math.max(10, startWidth - deltaX);
                newHeight = Math.max(10, startHeight - deltaY);
                newLeft = startLeft + (startWidth - newWidth);
                newTop = startTop + (startHeight - newHeight);
                break;
            case 'top':
                newHeight = Math.max(10, startHeight - deltaY);
                newTop = startTop + (startHeight - newHeight);
                break;
            case 'top-right':
                newWidth = Math.max(10, startWidth + deltaX);
                newHeight = Math.max(10, startHeight - deltaY);
                newTop = startTop + (startHeight - newHeight);
                break;
            case 'left':
                newWidth = Math.max(10, startWidth - deltaX);
                newLeft = startLeft + (startWidth - newWidth);
                break;
            case 'right':
                newWidth = Math.max(10, startWidth + deltaX);
                break;
            case 'bottom-left':
                newWidth = Math.max(10, startWidth - deltaX);
                newHeight = Math.max(10, startHeight + deltaY);
                newLeft = startLeft + (startWidth - newWidth);
                break;
            case 'bottom':
                newHeight = Math.max(10, startHeight + deltaY);
                break;
            case 'bottom-right':
                newWidth = Math.max(10, startWidth + deltaX);
                newHeight = Math.max(10, startHeight + deltaY);
                break;
        }

        // Restricciones de contenedor
        newLeft = Math.max(0, Math.min(containerRect.width - newWidth, newLeft));
        newTop = Math.max(0, Math.min(containerRect.height - newHeight, newTop));

        shape.style.width = `${newWidth}px`;
        shape.style.height = `${newHeight}px`;
        shape.style.left = `${newLeft}px`;
        shape.style.top = `${newTop}px`;

        // Manejo especial para triángulos
        if (shape.classList.contains('triangle')) {
            shape.style.borderLeft = `${newWidth / 2}px solid transparent`;
            shape.style.borderRight = `${newWidth / 2}px solid transparent`;
            shape.style.borderBottom = `${newHeight}px solid green`;
        }

        // Actualizar coordenadas y tamaño
        updateInfoPanel(shape);
    }

    function stopResize() {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        isResizing = false;
    }

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function updateInfoPanel(shape) {
    if (shape) {
        const x = parseInt(shape.style.left);
        const y = parseInt(shape.style.top);
        const width = shape.offsetWidth;
        const height = shape.offsetHeight;
        
        document.getElementById('coords').textContent = ` (${x}, ${y})`;
        document.getElementById('size').textContent = ` (${width}, ${height})`;
    }
}

function selectShape(shape, layerItem) {
    // Deseleccionar forma anterior
    if (selectedShape) {
        selectedShape.classList.remove('selected');
        // Remover manejadores de resize si existen
        const existingHandles = selectedShape.querySelectorAll('.resize-handle');
        existingHandles.forEach(handle => handle.remove());
        
        const prevLayerItem = document.querySelector(`.layer-item.selected`);
        if (prevLayerItem) prevLayerItem.classList.remove('selected');
    }

    // Seleccionar nueva forma
    selectedShape = shape;
    shape.classList.add('selected');
    layerItem.classList.add('selected');
    
    // Crear manejadores de redimensionamiento
    addResizeHandles(shape);
    
    // Actualizar coordenadas y tamaño
    updateInfoPanel(shape);
}

function addResizeHandles(shape) {
    // Primero remover cualquier manejador existente
    const existingHandles = shape.querySelectorAll('.resize-handle');
    existingHandles.forEach(handle => handle.remove());
    
    // Crear manejadores de redimensionamiento
    const resizeDirections = [
        'top-left', 'top', 'top-right', 
        'left', 'right', 
        'bottom-left', 'bottom', 'bottom-right'
    ];
    
    resizeDirections.forEach(direction => {
        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle', direction);
        resizeHandle.dataset.direction = direction;
        shape.appendChild(resizeHandle);
    });
}

function deleteShape() {
    if (selectedShape) {
        selectedShape.remove();
        const layerItem = document.querySelector(`.layer-item.selected`);
        if (layerItem) layerItem.remove();
        selectedShape = null;
        
        // Limpiar información
        document.getElementById('coords').textContent = " (x, y)";
        document.getElementById('size').textContent = " (ancho, alto)";
    }
}

function duplicateShape() {
    if (selectedShape) {
        const newShape = selectedShape.cloneNode(true);
        const newId = `shape-${Date.now()}`;
        newShape.dataset.id = newId;
        newShape.style.left = `${parseInt(selectedShape.style.left) + 20}px`;
        newShape.style.top = `${parseInt(selectedShape.style.top) + 20}px`;
        
        // Eliminar los manejadores de redimensionamiento
        const existingHandles = newShape.querySelectorAll('.resize-handle');
        existingHandles.forEach(handle => handle.remove());
        
        // Reestablecer eventos
        newShape.addEventListener('mousedown', handleMouseDown);
        newShape.addEventListener('contextmenu', showContextMenu);
        
        document.getElementById('container').appendChild(newShape);
        
        const layerItems = document.querySelector('.layer-items');
        const layerItem = document.createElement('div');
        layerItem.classList.add('layer-item');
        layerItem.textContent = `${newShape.classList[1]} (${newShape.offsetWidth}x${newShape.offsetHeight})`;
        layerItem.dataset.id = newId;
        layerItem.addEventListener('click', () => selectShape(newShape, layerItem));
        
        // Agregar menú contextual a la capa
        layerItem.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            selectShape(newShape, layerItem);
            showContextMenu(event, newShape);
        });
        
        layerItems.appendChild(layerItem);
        
        // Seleccionar la nueva forma
        selectShape(newShape, layerItem);
    }
}

function resizeShape() {
    if (selectedShape) {
        const newWidth = prompt('Nuevo ancho:', selectedShape.offsetWidth);
        const newHeight = prompt('Nuevo alto:', selectedShape.offsetHeight);
        if (newWidth && newHeight) {
            selectedShape.style.width = `${newWidth}px`;
            selectedShape.style.height = `${newHeight}px`;

            // Manejo especial para triángulos
            if (selectedShape.classList.contains('triangle')) {
                selectedShape.style.borderLeft = `${newWidth / 2}px solid transparent`;
                selectedShape.style.borderRight = `${newWidth / 2}px solid transparent`;
                selectedShape.style.borderBottom = `${newHeight}px solid green`;
            }
            
            // Actualizar coordenadas y tamaño
            updateInfoPanel(selectedShape);
        }
    }
}

function editText(shape) {
    if (shape && shape.classList.contains('text')) {
        const currentText = shape.textContent || 'Texto de ejemplo';
        const newText = prompt('Editar texto:', currentText);
        if (newText !== null) {
            shape.textContent = newText;
        }
    }
}

// Prevenir el menú contextual del navegador en todo el documento
document.addEventListener('contextmenu', function(event) {
    // Permitir el menú contextual solo en las formas y las capas
    if (!event.target.closest('.shape') && !event.target.closest('.layer-item')) {
        event.preventDefault();
    }
});

function addText() {
    // Usar los valores de ancho y alto para el contenedor de texto
    const shapeWidth = document.getElementById('shapeWidth').value;
    const shapeHeight = document.getElementById('shapeHeight').value;
    const container = document.getElementById('container');
    const layerItems = document.querySelector('.layer-items');
    
    const textElement = document.createElement('div');
    textElement.classList.add('shape', 'text');
    textElement.style.width = `${shapeWidth}px`;
    textElement.style.height = `${shapeHeight}px`;
    textElement.style.left = `0px`;
    textElement.style.top = `0px`;
    textElement.dataset.id = `shape-${Date.now()}`;
    
    // Texto predeterminado
    const defaultText = 'Texto de ejemplo';
    textElement.textContent = defaultText;
    
    // Estilos básicos para el texto
    textElement.style.display = 'flex';
    textElement.style.alignItems = 'center';
    textElement.style.justifyContent = 'center';
    textElement.style.color = '#000';
    textElement.style.overflow = 'hidden';
    
    // Eventos
    textElement.addEventListener('mousedown', handleMouseDown);
    textElement.addEventListener('contextmenu', showContextMenu);
    
    container.appendChild(textElement);
    
    const layerItem = document.createElement('div');
    layerItem.classList.add('layer-item');
    layerItem.textContent = `texto (${shapeWidth}x${shapeHeight})`;
    layerItem.dataset.id = textElement.dataset.id;
    layerItem.addEventListener('click', () => selectShape(textElement, layerItem));
    
    // Menú contextual para capas
    layerItem.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        selectShape(textElement, layerItem);
        showContextMenu(event, textElement);
    });
    
    layerItems.appendChild(layerItem);
    
    // Seleccionar el texto recién creado
    selectShape(textElement, layerItem);
}

// Inicialización cuando la página se carga
window.addEventListener('load', function() {
    // Verificar si ya existe el botón de texto
    if (!document.getElementById('text-radio')) {
        // Agregar opción de texto al radio group
        const shapeRadioGroup = document.getElementById('shape');
        
        if (shapeRadioGroup) {
            const textLabel = document.createElement('label');
            
            const textInput = document.createElement('input');
            textInput.type = 'radio';
            textInput.name = 'radio';
            textInput.value = 'text';
            textInput.id = 'text-radio';
            
            const textSpan = document.createElement('span');
            const textIcon = document.createElement('i');
            textIcon.classList.add('fas', 'fa-font');
            textSpan.appendChild(textIcon);
            
            textLabel.appendChild(textInput);
            textLabel.appendChild(textSpan);
            
            shapeRadioGroup.appendChild(textLabel);
        }
    }
});