$(document).ready(function() {
    
    const API_URL = 'http://localhost:3000/eventos';
    let calendar;

    // Lista de tipos de evento aceitos (para validação)
    const VALID_EVENT_TYPES = ['prova', 'viagem', 'congresso', 'estudo', 'reuniao'];

    // FUNÇÃO DE VALIDAÇÃO (SEGURANÇA E ROBUSTEZ)
    function validateEventData(dataObj) {

        const { nome, data, tipo } = dataObj;

        if (!nome || nome.trim() === '') {

            alert('O Nome do evento é obrigatório.');
            return false;

        }
        
        // Validação de Data (Formato e Validade)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!data || !dateRegex.test(data)) {

            alert('O formato da Data deve ser YYYY-MM-DD.');
            return false;

        }
        
        // Verifica se a data é uma data real
        const dateObj = new Date(data);
        if (isNaN(dateObj.getTime())) {

            alert('A Data inserida não é válida.');
            return false;

        }
        
        // Validação de Tipo
        if (!tipo || !VALID_EVENT_TYPES.includes(tipo)) {

            alert(`O Tipo de evento "${tipo}" não é válido. Selecione uma opção válida.`);
            return false;

        }

        return true;

    }

    // FUNÇÕES DE LAYOUT E MANIPULAÇÃO DE DADOS

    // Função auxiliar para fechar o painel de detalhes
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
        
        // Ordenar por data
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
    function fetchAndUpdateAll() {

        $.ajax({
            url: API_URL,
            type: 'GET',
            dataType: 'json'

        })

        .done(function(data) {

            // Atualiza a lista de eventos
            renderEventList(data);
            
            // Mapeia e atualiza o FullCalendar
            const fcEvents = data.map(eventData => ({

                id: eventData.id,
                title: eventData.nome,
                start: eventData.data,
                extendedProps: eventData

            }));
            
            calendar.removeAllEvents();
            calendar.addEventSource(fcEvents);

        })

        .fail(function() {

            console.error('Erro ao carregar e atualizar dados do servidor.');
            alert('Erro ao carregar e atualizar dados do servidor. Verifique o json-server.');

        });

    }

    // FUNÇÃO PARA ABRIR O PAINEL FLUTUANTE
    function handleEventAction(info) {
        
        closeDetailsPanel(); 
        
        const eventId = info.event.id;
        const originalEventData = info.event.extendedProps; 
        const eventDate = info.event.startStr.split('T')[0];

        // Popula o painel
        $('#panelEventName').text(originalEventData.nome);
        $('#panelEventDate').text(eventDate);
        $('#panelEventType').text(originalEventData.tipo);
        $('#panelEventDescription').text(originalEventData.descricao);
        $('#panelEventId').val(eventId); 
        
        // Posiciona e mostra o painel
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
            
            events: {

                url: API_URL,
                method: 'GET',
                failure: function() {

                    alert('Erro ao carregar eventos. Verifique o json-server.');

                },

                success: function(info) {

                    // Chama a atualização para popular a lista na carga inicial
                    fetchAndUpdateAll(); 

                }

            },

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
    $('#panelEditButton').on('click', function() {

        const eventId = $('#panelEventId').val();
        closeDetailsPanel();
        
        const fcEvent = calendar.getEventById(eventId);
        if (!fcEvent) return;

        const originalEventData = fcEvent.extendedProps;
        const eventDate = fcEvent.startStr.split('T')[0];
        
        // --- 1. CAPTURAR E VALIDAR NOVOS DADOS SEQUENCIALMENTE ---
        
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

        // Validação antes de enviar
        if (!validateEventData(updatedEvent)) {

            return;

        }

        // Requisição PUT para atualizar
        $.ajax({

            url: `${API_URL}/${eventId}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedEvent)

        })

        .done(function() {

            fetchAndUpdateAll();

        })

        .fail(function() {

            alert('Erro ao atualizar o evento.');

        });

    });

    // LÓGICA DE EXCLUSÃO (Botão no Painel)
    $('#panelDeleteButton').on('click', function() {

        const eventId = $('#panelEventId').val();
        closeDetailsPanel();

        const fcEvent = calendar.getEventById(eventId);
        if (!fcEvent) return;
        const originalEventData = fcEvent.extendedProps;

        if (!confirm(`Tem certeza que deseja deletar o evento: ${originalEventData.nome}?`)) {

            return;

        }
        
        $.ajax({

            url: `${API_URL}/${eventId}`,
            type: 'DELETE'

        })

        .done(function() {

            fetchAndUpdateAll();

        })

        .fail(function() {

            alert('Erro ao deletar o evento.');

        });

    });


    // CREATE (Adicionar Evento)
    $('form').on('submit', function(e) {

        e.preventDefault();
        const $form = $(this);

        const eventName = $('#eventName').val();
        const eventDate = $('#eventDate').val();
        const eventDescription = $('#eventDescription').val() || "Sem descrição.";
        const eventType = $('#eventType').val();


        const newEvent = {

            usuarioID: 2, 
            nome: eventName,
            descricao: eventDescription, 
            tipo: eventType, 
            data: eventDate 

        };

        // Validação antes de enviar
        if (!validateEventData(newEvent)) {

            return;

        }

        $.ajax({

            url: API_URL,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newEvent) 

        })

        .done(function() {

            fetchAndUpdateAll(); 
            $form[0].reset();

        })

        .fail(function() {

            alert('Erro ao salvar o evento.');

        });

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