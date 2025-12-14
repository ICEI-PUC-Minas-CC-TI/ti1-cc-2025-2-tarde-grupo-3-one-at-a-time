// app_events_calendar.js
// DEPENDÊNCIA: auth.js, api.js, jQuery, FullCalendar

$(document).ready(function() {
    
    // A API_URL só é necessária aqui para formar a URL base se não usássemos api.js. 
    // Usaremos as funções do api.js
    const API_URL_BASE = 'http://localhost:3000';
    let calendar;

    const VALID_EVENT_TYPES = ['prova', 'viagem', 'congresso', 'estudo', 'reuniao'];

    // FUNÇÃO DE VALIDAÇÃO (mantida)
    function validateEventData(dataObj) {
        const { nome, data, tipo } = dataObj;
        if (!nome || nome.trim() === '') {
            alert('O Nome do evento é obrigatório.');
            return false;
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!data || !dateRegex.test(data)) {
            alert('O formato da Data deve ser YYYY-MM-DD.');
            return false;
        }
        const dateObj = new Date(data);
        if (isNaN(dateObj.getTime())) {
            alert('A Data inserida não é válida.');
            return false;
        }
        if (!tipo || !VALID_EVENT_TYPES.includes(tipo)) {
            alert(`O Tipo de evento "${tipo}" não é válido. Selecione uma opção válida.`);
            return false;
        }
        return true;
    }

    // FUNÇÕES DE LAYOUT (mantidas)
    function closeDetailsPanel() {
        $('#eventDetailsPanel').hide();
    }

    // Renderiza a Lista de Eventos (Título e Data)
    function renderEventList(eventsData) {
        const $list = $('#eventList');
        $list.empty(); 
        if (eventsData.length === 0) {
            $list.append('<li class="list-group-item">Nenhum evento adicionado.</li>');
            return;
        }
        const sortedEvents = eventsData.slice().sort((a, b) => new Date(a.data) - new Date(b.data));

        sortedEvents.forEach(event => {
            const dateParts = event.data.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : event.data;
            const listItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${event.nome}</span>
                    <small class="text-primary">${formattedDate}</small>
                </li>
            `;
            $list.append(listItem);
        });
    }

    // FUNÇÃO CENTRALIZADA: BUSCA DADOS E ATUALIZA CALENDÁRIO E LISTA
    async function fetchAndUpdateAll() {
        try {
            // *** MUDANÇA CRUCIAL: Usa api.js para filtrar por usuarioID ***
            const data = await getItensDoUsuario('eventos');

            renderEventList(data);
            
            const fcEvents = data.map(eventData => ({
                id: eventData.id,
                title: eventData.nome,
                start: eventData.data, // FullCalendar espera YYYY-MM-DD
                extendedProps: eventData // Guarda o objeto completo
            }));
            
            calendar.removeAllEvents();
            calendar.addEventSource(fcEvents);

        } catch (error) {
            console.error('Erro ao carregar e atualizar dados do servidor:', error);
            alert(`Erro ao carregar e atualizar dados do servidor. ${error.message}`);
        }
    }

    // FUNÇÃO PARA ABRIR O PAINEL FLUTUANTE (mantida)
    function handleEventAction(info) {
        closeDetailsPanel(); 
        
        const eventId = info.event.id;
        const originalEventData = info.event.extendedProps; 
        const eventDate = info.event.startStr.split('T')[0];

        $('#panelEventName').text(originalEventData.nome);
        $('#panelEventDate').text(eventDate);
        $('#panelEventType').text(originalEventData.tipo);
        $('#panelEventDescription').text(originalEventData.descricao);
        $('#panelEventId').val(eventId); 
        
        const eventElement = $(info.el);
        const calendarContainer = $('.calendar');
        
        const position = eventElement.offset();
        const calendarOffset = calendarContainer.offset();
        
        $('#eventDetailsPanel').css({
            top: position.top - calendarOffset.top + eventElement.outerHeight() + 5,
            left: position.left - calendarOffset.left
        }).show();
        
        info.jsEvent.stopPropagation(); 
    }


    // FUNÇÃO PRINCIPAL: Inicializar FullCalendar
    function initializeCalendar() {
        const calendarEl = document.getElementById('fullcalendar');
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', 
            locale: 'pt-br', 
            headerToolbar: {
                left: 'title',
                right: 'prev,next today'
            },
            timeZone: 'local',
            editable: true, 
            eventClick: handleEventAction, 
            
            // Remove o endpoint de eventos do FullCalendar e faz a carga via fetchAndUpdateAll
            events: [], 
            
            // Chama a atualização inicial após a renderização
            viewDidMount: function() {
                 fetchAndUpdateAll(); 
            }
        });

        calendar.render();
    }
    
    // LÓGICA DE FECHAR PAINEL
    $('#closePanelBtn').on('click', closeDetailsPanel);
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.calendar').length && 
            !$(e.target).closest('#eventDetailsPanel').length) {
            closeDetailsPanel();
        }
    });


    // LÓGICA DE EDIÇÃO COMPLETA (Botão no Painel)
    $('#panelEditButton').on('click', async function() {
        const eventId = $('#panelEventId').val();
        closeDetailsPanel();
        
        const fcEvent = calendar.getEventById(eventId);
        if (!fcEvent) return;

        const originalEventData = fcEvent.extendedProps;
        const eventDate = fcEvent.startStr.split('T')[0];
        
        // Capturar e validar novos dados (simplificado com prompt)
        const newName = prompt('Editar Nome:', originalEventData.nome);
        if (newName === null) return; 
        
        const newDescription = prompt('Editar Descrição:', originalEventData.descricao);
        if (newDescription === null) return; 

        const newType = prompt(`Editar Tipo (válidos: ${VALID_EVENT_TYPES.join(', ')}):`, originalEventData.tipo);
        if (newType === null) return; 

        const newDate = prompt(`Editar Data (Formato: YYYY-MM-DD):`, eventDate);
        if (newDate === null) return; 


        const updatedEvent = {
            ...originalEventData,
            nome: newName.trim(),
            descricao: newDescription.trim(),
            tipo: newType.trim(),
            data: newDate.trim()
        };

        if (!validateEventData(updatedEvent)) return;

        try {
            // *** MUDANÇA: Usa apiRequest para PUT ***
            await apiRequest('PUT', 'eventos', eventId, updatedEvent);
            alert('Evento atualizado com sucesso!');
            fetchAndUpdateAll();
        } catch (error) {
            alert(`Erro ao atualizar o evento: ${error.message}`);
        }
    });

    // LÓGICA DE EXCLUSÃO (Botão no Painel)
    $('#panelDeleteButton').on('click', async function() {
        const eventId = $('#panelEventId').val();
        closeDetailsPanel();

        const fcEvent = calendar.getEventById(eventId);
        if (!fcEvent) return;
        const originalEventData = fcEvent.extendedProps;

        if (!confirm(`Tem certeza que deseja deletar o evento: ${originalEventData.nome}?`)) return;
        
        try {
            // *** MUDANÇA: Usa apiRequest para DELETE ***
            await apiRequest('DELETE', 'eventos', eventId);
            alert('Evento deletado com sucesso!');
            fetchAndUpdateAll();
        } catch (error) {
            alert(`Erro ao deletar o evento: ${error.message}`);
        }
    });


    // CREATE (Adicionar Evento)
    $('form').on('submit', async function(e) {
        e.preventDefault();
        const $form = $(this);

        const eventName = $('#eventName').val();
        const eventDate = $('#eventDate').val();
        const eventDescription = $('#eventDescription').val() || "Sem descrição.";
        const eventType = $('#eventType').val();

        const newEvent = {
            // usuarioID será injetado pelo criarItemParaUsuario
            nome: eventName,
            descricao: eventDescription, 
            tipo: eventType, 
            data: eventDate 
        };

        if (!validateEventData(newEvent)) return;

        try {
            // *** MUDANÇA CRUCIAL: Usa criarItemParaUsuario para injetar usuarioID ***
            await criarItemParaUsuario('eventos', newEvent);
            alert('Evento salvo com sucesso!');
            fetchAndUpdateAll(); 
            $form[0].reset();
        } catch (error) {
            alert(`Erro ao salvar o evento: ${error.message}`);
        }
    });


    // CARGA INICIAL E LÓGICA DE NAVEGAÇÃO RÁPIDA
    initializeCalendar(); 

    $('#gotoDate').on('change', function() {
        const selectedDate = $(this).val();
        if (selectedDate) {
            calendar.gotoDate(selectedDate);
        }
        $(this).val(''); 
    });
});