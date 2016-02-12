import CreateModalController from './CreateModalController'
import EditModalController from './EditModalController'

export default class GroupController {
    constructor($http, ClarolineSearchService, clarolineAPI, $uibModal) {
        this.$http = $http
        this.ClarolineSearchService = ClarolineSearchService
        this.clarolineAPI = clarolineAPI
        this.$uibModal = $uibModal
        this.search = ''
        this.savedSearch = []
        this.fields = []
        this.selected = []
        this.alerts = []

        const columns = [
            {name: this.translate('name'), prop: "name", isCheckboxColumn: true, headerCheckbox: true},
            {
                name: this.translate('actions'),
                cellRenderer: function(scope) {
                    /*
                    const groupId = scope.$row.id;
                    const actions = 
                        `<a ui-sref="users.groups.users({groupId: '${groupId}')"><i class="fa fa-users"></i> </a>
                         <a class="pointer" ng-click="gc.clickEdit($row)"><i class="fa fa-cog"></i></a>`

                    return actions;*/

                    var groupId = scope.$row.id;
                    var users = '<a ui-sref="users.groups.users({groupId: ' + groupId + '})"><i class="fa fa-users"></i> </a>';
                    var edit =  '<a class="pointer" ng-click="gc.clickEdit($row)"><i class="fa fa-cog"></i></a>';
                    var actions = users + edit;

                    return actions;
                }
            }
        ];

        this.dataTableOptions = {
            scrollbarV: false,
            columnMode: 'force',
            headerHeight: 50,
            footerHeight: 50,
            selectable: true,
            multiSelect: true,
            checkboxSelection: true,
            columns: columns,
            paging: {
                externalPaging: true,
                size: 10
            }
        };

        $http.get(Routing.generate('api_get_group_searchable_fields'))
            .then(d => this.fields = d.data)
    }

    translate(key, data = {}) {
        return window.Translator.trans(key, data, 'platform');
    }

    generateQsForSelected() {
        let qs = '';

        for (let i = 0; i < this.selected.length; i++) {
            qs += 'userIds[]=' + this.selected[i].id + '&'
        }

        return qs
    }

    deleteCallback(data) {
        for (let i = 0; i < this.selected.length; i++) {
            this.alerts.push({
                type: 'success',
                msg: this.translate('group_removed', {group: this.selected[i].name})
            });
        }

        this.dataTableOptions.paging.count -= this.selected.length;
        this.clarolineAPI.removeElements(this.selected, this.groups);
        this.selected.splice(0, this.selected.length);
    }

    closeAlert(index) {
        this.alerts.splice(index, 1);
    }

    clickNew() {
        const modalInstance = this.$uibModal.open({
            templateUrl: Routing.generate('api_get_create_group_form', {'_format': 'html'}),
            controller: () => new CreateModalController
        })

        modalInstance.result.then(result => {
            if (!result) return;
            this.groups.push(result);
            this.dataTableOptions.paging.count = this.groups.length;

            this.alerts.push({
                type: 'success',
                msg: this.translate('group_created', {group: result.name})
            });
        })
    }

    clickEdit(group) {
        const modalInstance = this.$uibModal.open({
            templateUrl: Routing.generate('api_get_edit_group_form', {'_format': 'html', 'group': group.id}),
            controller: () => EditModalController
        });

        modalInstance.result.then(result => {
            if (!result) return;
            //dirty but it works
            this.groups = this.clarolineAPI.replaceById(result, this.groups);
        });
    }

    onSearch(searches) {
        this.savedSearch = searches;
        this.ClarolineSearchService.find('api_get_search_groups', searches, this.dataTableOptions.paging.offset, this.dataTableOptions.paging.size).then(d => {
            this.groups = d.data.groups;
            this.dataTableOptions.paging.count = d.data.total;
        })
    }

   paging(offset, size) {
        this.ClarolineSearchService.find('api_get_search_groups', this.savedSearch, offset, size).then(d => {
            const groups = d.data.groups;

            //I know it's terrible... but I have no other choice with this table.
            for (let i = 0; i < offset * size; i++) {
                groups.unshift({});
            }

            this.groups = groups;
            this.dataTableOptions.paging.count = d.data.total;
        })
    }

    clickDelete() {
        const url = Routing.generate('api_delete_groups') + '?' + this.generateQsForSelected();

        let groups = '';

        for (let i = 0; i < this.selected.length; i++) {
            groups +=  this.selected[i].name
            if (i < this.selected.length - 1) groups += ', ';
        }

        this.clarolineAPI.confirm(
            {url: url, method: 'DELETE'},
            this.deleteCallback,
            this.translate('delete_groups'),
            this.translate('delete_groups_confirm', {group_list: groups})
        );
    }
}
