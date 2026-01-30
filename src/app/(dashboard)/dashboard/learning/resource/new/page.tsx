import { getProjectsForSelectAction } from '../../actions';
import GlobalResourceForm from './GlobalResourceForm';

export default async function NewGlobalResourcePage() {
    const projects = await getProjectsForSelectAction();

    return <GlobalResourceForm projects={projects} />;
}
