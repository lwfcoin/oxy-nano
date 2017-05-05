const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const moment = require('moment');

const expect = chai.expect;
chai.use(sinonChai);

describe('Forging component', () => {
  let $compile;
  let $rootScope;
  let element;
  let $scope;
  let lsk;
  let $peers;
  let delegate;
  let account;

  beforeEach(angular.mock.module('app'));

  beforeEach(inject((_$compile_, _$rootScope_, _lsk_, _$peers_, _Account_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    lsk = _lsk_;
    $peers = _$peers_;
    account = _Account_;
  }));

  beforeEach(() => {
    delegate = {
      passphrase: 'recipe bomb asset salon coil symbol tiger engine assist pact pumpkin visit',
      address: '537318935439898807L',
      approval: 90,
      missedblocks: 10,
      producedblocks: 304,
      productivity: 96.82,
      publicKey: '3ff32442bb6da7d60c1b7752b24e6467813c9b698e0f278d48c43580da972135',
      rate: 20,
      username: 'genesis_42',
      vote: '9999982470000000',
    };

    account.set({
      passphrase: delegate.passphrase,
      balance: lsk.from(100),
    });

    $peers.active = { sendRequest() {} };
    const mock = sinon.mock($peers.active);
    mock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
      success: true,
      blocks: [],
    });
    mock.expects('sendRequest').withArgs('delegates/get').callsArgWith(2, {
      success: true,
      delegate,
    });
    mock.expects('sendRequest').withArgs('delegates/forging/getForgedByAccount').exactly(5);

    $scope = $rootScope.$new();
    element = $compile('<forging account="account"></forging>')($scope);
    $scope.$digest();
  });

  it('should contain a card with delegate name', () => {
    expect(element.find('md-card').text()).to.contain(delegate.username);
  });

  it('should contain a card with rank ', () => {
    expect(element.find('md-card').text()).to.contain(`Rank${delegate.rate}`);
  });

  it('should contain a card with productivity ', () => {
    expect(element.find('md-card').text()).to.contain(`Productivity${delegate.productivity}%`);
  });

  it('should contain a card with approval ', () => {
    expect(element.find('md-card').text()).to.contain(`Approval${delegate.approval}%`);
  });

  const FORGED_BLOCKS_TITLE = 'Forged Blocks';
  it(`should contain a card with title ${FORGED_BLOCKS_TITLE}`, () => {
    expect(element.find('md-card .md-title').text()).to.equal(FORGED_BLOCKS_TITLE);
  });
});

describe('forging component controller', () => {
  beforeEach(angular.mock.module('app'));

  let $rootScope;
  let $scope;
  let controller;
  let $componentController;
  let activePeerMock;
  let delegate;
  let blocks;
  let account;

  beforeEach(inject((_$componentController_, _$rootScope_, _Account_) => {
    $componentController = _$componentController_;
    $rootScope = _$rootScope_;
    account = _Account_;
  }));

  beforeEach(() => {
    blocks = Array.from({ length: 10 }, (v, k) => ({
      id: 10 - k,
      timestamp: 10 - k,
    }));

    delegate = {
      passphrase: 'recipe bomb asset salon coil symbol tiger engine assist pact pumpkin visit',
      address: '537318935439898807L',
      approval: 90,
      missedblocks: 10,
      producedblocks: 304,
      productivity: 96.82,
      publicKey: '3ff32442bb6da7d60c1b7752b24e6467813c9b698e0f278d48c43580da972135',
      rate: 20,
      username: 'genesis_42',
      vote: '9999982470000000',
    };


    $scope = $rootScope.$new();
    account.set({
      passphrase: delegate.passphrase,
      balance: '10000',
    });
    controller = $componentController('forging', $scope, {
      // account: {
      //   address: '8273455169423958419L',
      //   balance: '10000',
      // },
    });

    controller.$peers.active = { sendRequest() {} };
    activePeerMock = sinon.mock(controller.$peers.active);
  });

  describe('updateDelegate()', () => {
    beforeEach(() => {
    });

    it('sets this.delegate to delegate object if delegate exists', () => {
      activePeerMock.expects('sendRequest').withArgs('delegates/get').callsArgWith(2, {
        success: true,
        delegate,
      });
      expect(controller.delegate).to.equal(undefined);
      controller.updateDelegate();
      expect(controller.delegate).to.deep.equal(delegate);
    });

    it('sets this.delegate = {} if delegate does not exist', () => {
      activePeerMock.expects('sendRequest').withArgs('delegates/get').callsArgWith(2, {
        success: false,
      });
      expect(controller.delegate).to.equal(undefined);
      controller.updateDelegate();
      expect(controller.delegate).to.deep.equal({});
    });
  });

  describe('updateForgedBlocks(limit, offset)', () => {
    it('does nothing if request fails', () => {
      activePeerMock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
        success: false,
      });
      controller.updateForgedBlocks(10);
      expect(controller.blocks).to.deep.equal([]);
    });

    it('updates this.blocks with what was returned', () => {
      activePeerMock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
        success: true,
        blocks,
      });
      controller.updateForgedBlocks(10);
      expect(controller.blocks.length).to.equal(10);
      expect(controller.blocks).to.deep.equal(blocks);
    });

    it('appends returned blocks to this.blocks if offset is set', () => {
      const extraBlocks = Array.from({ length: 20 }, (v, k) => ({
        id: 0 - k,
        timestamp: 0 - k,
      }));
      activePeerMock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
        success: true,
        blocks: extraBlocks,
      });
      controller.blocks = blocks;
      controller.updateForgedBlocks(20, 10);
      expect(controller.blocks.length).to.equal(30);
      expect(controller.blocks).to.deep.equal(blocks);
    });

    it('does not change this.blocks when returned blocks values are unchanged', () => {
      activePeerMock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
        success: true,
        blocks,
      });
      controller.blocks = blocks;
      controller.updateForgedBlocks(10);
      expect(controller.blocks).to.deep.equal(blocks);
    });

    it('prepends to this.blocks when returned blocks contains a new value', () => {
      const newBlock = { id: 11, timestamp: 11 };
      activePeerMock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
        success: true,
        blocks: [newBlock].concat(blocks),
      });
      controller.blocks = blocks;
      controller.updateForgedBlocks(10);
      expect(controller.blocks.length).to.equal(11);
      expect(controller.blocks[0]).to.deep.equal(newBlock);
    });
  });

  describe('loadMoreBlocks()', () => {
    it('fetches and appends 20 more blocks to this.blocks', () => {
      const extraBlocks = Array.from({ length: 20 }, (v, k) => ({
        id: 0 - k,
        timestamp: 0 - k,
      }));
      activePeerMock.expects('sendRequest').withArgs('blocks').callsArgWith(2, {
        success: true,
        blocks: extraBlocks,
      });
      controller.blocks = blocks;
      controller.loadMoreBlocks();
      expect(controller.blocks.length).to.equal(30);
      expect(controller.blocks).to.deep.equal(blocks);
    });
  });

  describe('updateForgingStats(key, startMoment)', () => {
    it('fetches forged by account since startMoment and sets it to this.statistics[key]', () => {
      const forged = 42;
      const key = 'testStat';
      const startMoment = moment().subtract(1, 'days');
      activePeerMock.expects('sendRequest').withArgs('delegates/forging/getForgedByAccount').callsArgWith(2, {
        success: true,
        forged,
      });

      expect(controller.statistics[key]).to.equal(undefined);
      controller.updateForgingStats(key, startMoment);
      expect(controller.statistics[key]).to.equal(forged);
    });

    it('does nothing after failing to fetch forged by account since startMoment', () => {
      const key = 'testStat';
      const startMoment = moment().subtract(1, 'days');
      activePeerMock.expects('sendRequest').withArgs('delegates/forging/getForgedByAccount').callsArgWith(2, {
        success: false,
      });

      expect(controller.statistics[key]).to.equal(undefined);
      controller.updateForgingStats(key, startMoment);
      expect(controller.statistics[key]).to.equal(undefined);
    });
  });
});