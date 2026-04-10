import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import './DashboardPage.css';
import './MissionsPage.css';

const MissionsPage = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Utilisateur';

    // Missions logic remains the same

    return (
        <UserLayout activePage="missions">
            <header className="page-header" style={{ alignItems: 'flex-start' }}>
                <div className="header-text">
                    <h1 className="welcome-title text-3xl font-black text-slate-900">Tableau de Service</h1>
                    <p className="welcome-subtitle text-slate-500 mt-2">Suivi opérationnel des missions d'inspection.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-card-missions">
                        <p className="stat-label-missions">En cours</p>
                        <p className="stat-value-missions">5</p>
                    </div>
                    <div className="stat-card-missions">
                        <p className="stat-label-missions tertiary">Terminées</p>
                        <p className="stat-value-missions">42</p>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="filters-container-missions">
                <div className="search-wrapper-missions">
                    <span className="material-symbols-outlined">search</span>
                    <input type="text" placeholder="Rechercher par admin, pièce ou ID..." />
                </div>
                <button className="filter-date-btn">
                    <span className="material-symbols-outlined">calendar_today</span>
                    <span>Filtrer par date</span>
                    <span className="material-symbols-outlined">expand_more</span>
                </button>
            </div>

            {/* Same content as before */}
            <section className="missions-section">
                <div className="section-header-missions">
                    <h2>Missions actives</h2>
                    <div className="section-divider"></div>
                </div>
                <div className="table-card-missions">
                    <div className="table-responsive">
                        <table className="missions-data-table">
                            <thead>
                                <tr>
                                    <th>Admin</th>
                                    <th>Pièce</th>
                                    <th>Description</th>
                                    <th>Deadline</th>
                                    <th>Temps restant</th>
                                    <th>Statut</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="admin-cell">
                                            <div className="admin-avatar primary-bg">JD</div>
                                            <span>Jean Dupont</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="piece-cell-missions">
                                            <div className="piece-img-box">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF7RTGkGa7RfOFrvd1HFQhXQ_G1y3avWoBelTCSPEV_AXZYWeBF8PcwYMmg-_L31gfeZRZroWbRDuKbwuacsIItQ4yPpO16MDKpA1-OP87HjC76jupk9tY6sUhFRjPPBLJIz47sCWYsr4knZrrguvNgu6dIXXTcs8YHfFg8dEJmesP6sq9W8eNz4N9L4ni-TXZn2DUGBkG5JfXW-6-ABBwCMhaN8cHhyhILN8-XDztynrI0REBiVUFSM1NMC0u_VwFMdRDTKUNdBA" alt="Piece" />
                                            </div>
                                            <div>
                                                <div className="piece-name-missions">Turbine B-42</div>
                                                <div className="piece-id-missions">#ID-88291</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="desc-text-missions">Inspection structurelle annuelle des pales et du moyeu central...</p>
                                    </td>
                                    <td>15 Oct, 14:00</td>
                                    <td>
                                        <div className="progress-cell-missions">
                                            <span className="progress-time-text secondary">1h 25min</span>
                                            <div className="progress-bar-missions">
                                                <div className="progress-fill-missions secondary-gradient" style={{ width: '85%' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-tag-missions secondary">En cours</span>
                                    </td>
                                    <td className="text-right">
                                        <button className="analyze-btn" onClick={() => navigate('/inspection')}>Analyser maintenant</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="admin-cell">
                                            <div className="admin-avatar tertiary-bg">SM</div>
                                            <span>Sarah Martin</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="piece-cell-missions">
                                            <div className="piece-img-box">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpX231VCDCle8XzMt8j_i39RJpYtujxNxKO4UyRAg7fZstloIT41S68JVjgyzqmrRMv2oiXDN1LeoPvcHYIqlAlV-GgxXk3Pn3f7G_UAFsj2gJcWYKjzD6iGROH7TFezuAhh6UiOuOdLZSJO0e03SXJj1jNo9M-bx6JSLOA6AOnyhhmADoMXU9fHYGi-3nPqWZVzTlE-H01IELpwDWIV30BWIn3vNtjL-AOO0BUVVVvUcIE2D721yliNf7hq6AlkmHmzm5zrkpNIc" alt="Piece" />
                                            </div>
                                            <div>
                                                <div className="piece-name-missions">Control PCB v4</div>
                                                <div className="piece-id-missions">#ID-11024</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="desc-text-missions">Vérification thermique des condensateurs haute tension...</p>
                                    </td>
                                    <td>16 Oct, 09:00</td>
                                    <td>
                                        <div className="progress-cell-missions">
                                            <span className="progress-time-text tertiary">18h 40min</span>
                                            <div className="progress-bar-missions">
                                                <div className="progress-fill-missions tertiary-gradient" style={{ width: '30%' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-tag-missions secondary">En cours</span>
                                    </td>
                                    <td className="text-right">
                                        <button className="analyze-btn" onClick={() => navigate('/inspection')}>Analyser maintenant</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards for Active Missions */}
                    <div className="missions-cards-mobile">
                        {[1, 2].map((i) => (
                            <div key={i} className="mission-mobile-card">
                                <div className="mission-card-header">
                                    <div className="mission-admin-info">
                                        <div className={`admin-avatar ${i === 1 ? 'primary-bg' : 'tertiary-bg'}`}>
                                            {i === 1 ? 'JD' : 'SM'}
                                        </div>
                                        <span className="admin-name-mobile">{i === 1 ? 'Jean Dupont' : 'Sarah Martin'}</span>
                                    </div>
                                    <span className="status-tag-missions secondary">En cours</span>
                                </div>
                                <div className="mission-card-body">
                                    <div className="mission-piece-flex">
                                        <div className="piece-img-box">
                                            <img src={i === 1 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCF7RTGkGa7RfOFrvd1HFQhXQ_G1y3avWoBelTCSPEV_AXZYWeBF8PcwYMmg-_L31gfeZRZroWbRDuKbwuacsIItQ4yPpO16MDKpA1-OP87HjC76jupk9tY6sUhFRjPPBLJIz47sCWYsr4knZrrguvNgu6dIXXTcs8YHfFg8dEJmesP6sq9W8eNz4N9L4ni-TXZn2DUGBkG5JfXW-6-ABBwCMhaN8cHhyhILN8-XDztynrI0REBiVUFSM1NMC0u_VwFMdRDTKUNdBA" : "https://lh3.googleusercontent.com/aida-public/AB6AXuDpX231VCDCle8XzMt8j_i39RJpYtujxNxKO4UyRAg7fZstloIT41S68JVjgyzqmrRMv2oiXDN1LeoPvcHYIqlAlV-GgxXk3Pn3f7G_UAFsj2gJcWYKjzD6iGROH7TFezuAhh6UiOuOdLZSJO0e03SXJj1jNo9M-bx6JSLOA6AOnyhhmADoMXU9fHYGi-3nPqWZVzTlE-H01IELpwDWIV30BWIn3vNtjL-AOO0BUVVVvUcIE2D721yliNf7hq6AlkmHmzm5zrkpNIc"} alt="Piece" />
                                        </div>
                                        <div className="piece-info-mobile">
                                            <div className="piece-name-missions">{i === 1 ? 'Turbine B-42' : 'Control PCB v4'}</div>
                                            <div className="piece-id-missions">{i === 1 ? '#ID-88291' : '#ID-11024'}</div>
                                        </div>
                                    </div>
                                    <p className="mission-desc-mobile">
                                        {i === 1 ? 'Inspection structurelle annuelle des pales et du moyeu central...' : 'Vérification thermique des condensateurs haute tension...'}
                                    </p>
                                    <div className="mission-metrics-mobile">
                                        <div className="mission-metric">
                                            <span className="m-label">Deadline</span>
                                            <span className="m-value">{i === 1 ? '15 Oct, 14:00' : '16 Oct, 09:00'}</span>
                                        </div>
                                        <div className="mission-metric">
                                            <span className="m-label">Temps restant</span>
                                            <span className="m-value secondary">{i === 1 ? '1h 25min' : '18h 40min'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mission-card-footer">
                                    <button className="analyze-btn full-width" onClick={() => navigate('/inspection')}>Analyser maintenant</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="missions-section">
                <div className="section-header-missions">
                    <h2>Missions achevées</h2>
                    <div className="section-divider"></div>
                </div>
                <div className="table-card-missions">
                    <div className="table-responsive">
                        <table className="missions-data-table">
                            <thead className="bg-light">
                                <tr>
                                    <th>Admin</th>
                                    <th>Pièce</th>
                                    <th>Description</th>
                                    <th>Date Mission</th>
                                    <th>Complétion</th>
                                    <th>Statut</th>
                                    <th className="text-right">Rapport</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-missions">
                                <tr>
                                    <td>Marc L.</td>
                                    <td>
                                        <div className="piece-cell-missions mini">
                                            <div className="piece-img-box mini">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOt1mn90rWsQflWaB5P0jso2UOGl-A1zKKXOYGj_VI5joRWZfprQ6rNel9ziTcD9_4BDA1qlhAw86v9TQLLrmh1flQwtw_ko1FJeJiT0cxfhs-bI0lz8DEQrpNTA1CeI1dIEYV0c3U6o-dl0iVx8nGVELxYyYQo89fk0I6b0IAl5-hf30n06z5ygJX-cJ6mn38pLFroEXxEgGAlHgggK0CqsUAamlRCTLBs9Cino6dPyJThSSXuwrYWATWVElMeIJlIGXZucqNnfM" alt="Piece" />
                                            </div>
                                            <span>Culasse H-700</span>
                                        </div>
                                    </td>
                                    <td className="text-muted-missions">Analyse de porosité post-moulage...</td>
                                    <td>01 Oct 2023</td>
                                    <td>01 Oct 2023</td>
                                    <td>
                                        <span className="status-tag-missions tertiary">Terminée</span>
                                    </td>
                                    <td className="text-right">
                                        <button className="icon-btn-missions">
                                            <span className="material-symbols-outlined">picture_as_pdf</span>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Sarah Martin</td>
                                    <td>
                                        <div className="piece-cell-missions mini">
                                            <div className="piece-img-box mini">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmSRL7by3m1miLyoVUWjDETir_PEIe1UlcCK8Q8WEHCRfQIB4g-a6vDtK_jofuVoJ1NkaPktTElw6Kbd2oNrGB56pmyO6XWbcqGcNDYCNWU1AVUahof-J6IQCCPa_eSi7PHupjrdmj8cObBU0n2lKLxA4QoQZvHmsLPAYh1yPYL6ppXl37nTkcQMReeH5egQZBwJ1njKPnKmDo5ao8E93n7593p8S47mCOfOnx1eHatMou-WJZv-msEnzUUSw9Bx5jFJ7aOCH-rIQ" alt="Piece" />
                                            </div>
                                            <span>Bielle Renforcée</span>
                                        </div>
                                    </td>
                                    <td className="text-muted-missions">Mesure dimensionnelle micrométrique...</td>
                                    <td>28 Sep 2023</td>
                                    <td>29 Sep 2023</td>
                                    <td>
                                        <span className="status-tag-missions tertiary">Terminée</span>
                                    </td>
                                    <td className="text-right">
                                        <button className="icon-btn-missions">
                                            <span className="material-symbols-outlined">picture_as_pdf</span>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards for Completed Missions */}
                    <div className="missions-cards-mobile">
                        {[1, 2].map((i) => (
                            <div key={i} className="mission-mobile-card completed">
                                <div className="mission-card-header">
                                    <span className="admin-name-mobile">{i === 1 ? 'Marc L.' : 'Sarah Martin'}</span>
                                    <span className="status-tag-missions tertiary">Terminée</span>
                                </div>
                                <div className="mission-card-body">
                                    <div className="mission-piece-flex">
                                        <div className="piece-img-box mini">
                                            <img src={i === 1 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDOt1mn90rWsQflWaB5P0jso2UOGl-A1zKKXOYGj_VI5joRWZfprQ6rNel9ziTcD9_4BDA1qlhAw86v9TQLLrmh1flQwtw_ko1FJeJiT0cxfhs-bI0lz8DEQrpNTA1CeI1dIEYV0c3U6o-dl0iVx8nGVELxYyYQo89fk0I6b0IAl5-hf30n06z5ygJX-cJ6mn38pLFroEXxEgGAlHgggK0CqsUAamlRCTLBs9Cino6dPyJThSSXuwrYWATWVElMeIJlIGXZucqNnfM" : "https://lh3.googleusercontent.com/aida-public/AB6AXuAmSRL7by3m1miLyoVUWjDETir_PEIe1UlcCK8Q8WEHCRfQIB4g-a6vDtK_jofuVoJ1NkaPktTElw6Kbd2oNrGB56pmyO6XWbcqGcNDYCNWU1AVUahof-J6IQCCPa_eSi7PHupjrdmj8cObBU0n2lKLxA4QoQZvHmsLPAYh1yPYL6ppXl37nTkcQMReeH5egQZBwJ1njKPnKmDo5ao8E93n7593p8S47mCOfOnx1eHatMou-WJZv-msEnzUUSw9Bx5jFJ7aOCH-rIQ"} alt="Piece" />
                                        </div>
                                        <div className="piece-name-missions">{i === 1 ? 'Culasse H-700' : 'Bielle Renforcée'}</div>
                                    </div>
                                    <div className="mission-metrics-mobile">
                                        <div className="mission-metric">
                                            <span className="m-label">Date Mission</span>
                                            <span className="m-value">{i === 1 ? '01 Oct 2023' : '28 Sep 2023'}</span>
                                        </div>
                                        <div className="mission-metric">
                                            <span className="m-label">Complétion</span>
                                            <span className="m-value tertiary">{i === 1 ? '01 Oct 2023' : '29 Sep 2023'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mission-card-footer">
                                    <button className="btn-download-mobile">
                                        <span className="material-symbols-outlined">picture_as_pdf</span>
                                        Rapport PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="table-footer-missions">
                        <span>Affichage de 2 sur 42 missions terminées</span>
                        <button className="view-more-btn">Voir plus</button>
                    </div>
                </div>
            </section>

            <footer className="dashboard-footer">
                <span>© 2024 SMART INSPECT. Tous droits réservés.</span>
                <div className="footer-links">
                    <a href="#">Conditions d'utilisation</a>
                    <a href="#">Politique de confidentialité</a>
                    <a href="#">Support</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default MissionsPage;
